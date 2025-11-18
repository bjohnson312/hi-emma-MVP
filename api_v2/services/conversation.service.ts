import type {
  SendMessageRequest,
  SendMessageResponse,
  ConversationSession,
  Message,
  EndSessionRequest,
  EndSessionResponse,
  ConversationMemory,
} from '../types';
import { OpenAIProvider } from '../providers/openai.provider';
import type {
  IConversationProvider,
  NormalizedConversationInput,
} from '../providers/provider.types';

import {
  determineTimeOfDay,
  generateGreeting,
  shouldSuggestRoutine,
  type SessionType as RoutineSessionType,
  type TimeOfDay,
} from '../business/routine';
import {
  detectIntentFromMessage,
  shouldTriggerAction,
  generateSuggestedAction,
  validateIntentContext,
  type IntentType,
} from '../business/insights';
import {
  canResumeSession,
  shouldAutoCompleteSession,
  buildSessionContext,
  determineSessionType,
  generateSessionSummary,
  checkSessionWarnings,
  type SessionState,
  type SessionType,
} from '../business/session';

import { UserDataAccess } from '../data/user.data';
import { SessionDataAccess } from '../data/session.data';
import { ConversationDataAccess } from '../data/conversation.data';
import { RoutineDataAccess } from '../data/routine.data';

export class ConversationService {
  private provider: IConversationProvider = new OpenAIProvider();
  private userData = new UserDataAccess();
  private sessionData = new SessionDataAccess();
  private conversationData = new ConversationDataAccess();
  private routineData = new RoutineDataAccess();

  async sendMessage(userId: string, req: SendMessageRequest): Promise<SendMessageResponse> {
    const userProfile = await this.getUserProfile(userId);
    const timezone = userProfile.timezone;
    const currentTime = new Date();
    
    const timeOfDay = determineTimeOfDay(currentTime, timezone);
    
    const session = await this.getOrCreateSession(
      userId,
      req.sessionType || determineSessionType(req.sessionType as any, timeOfDay),
      timeOfDay
    );
    
    if (session.messageCount === 0 && !req.message) {
      const greeting = generateGreeting({
        userName: userProfile.name,
        timeOfDay,
        sessionType: session.type as RoutineSessionType,
        isFirstCheckIn: true,
        userContext: {
          currentStreak: userProfile.currentStreak,
          lastCheckInDate: userProfile.lastCheckInDate,
          recentMood: userProfile.recentMood,
        },
      });
      
      await this.storeMessage(session.id, userId, 'assistant', greeting, session.type);
      
      return {
        response: greeting,
        sessionId: session.id,
        timestamp: new Date().toISOString(),
        context: { timeOfDay, isGreeting: true },
      };
    }
    
    const detectedIntent = detectIntentFromMessage(req.message);
    
    const intentValidation = validateIntentContext(detectedIntent, {
      timeOfDay,
      activeRoutine: session.context?.routineType,
    });
    
    if (!intentValidation.isValid) {
      return {
        response: intentValidation.warning || 'Cannot perform that action right now.',
        sessionId: session.id,
        timestamp: new Date().toISOString(),
      };
    }
    
    if (shouldTriggerAction(detectedIntent)) {
      const suggestedAction = generateSuggestedAction(detectedIntent);
      
      if (detectedIntent.intent === 'start_morning_routine' || detectedIntent.intent === 'start_evening_routine') {
        const routineType = detectedIntent.intent === 'start_morning_routine' ? 'morning' : 'evening';
        const completedToday = await this.routineData.isRoutineCompletedToday(userId);
        const routinePrefs = await this.routineData.getRoutinePreferences(userId);
        
        const shouldStart = shouldSuggestRoutine({
          routineType,
          currentTime,
          timezone,
          userPreferences: {
            morningRoutineTime: routinePrefs?.wakeTime,
            eveningRoutineTime: userProfile.preferences?.eveningRoutineTime,
          },
          completedToday,
        });
        
        if (!shouldStart.shouldSuggest) {
          return {
            response: shouldStart.reason,
            sessionId: session.id,
            timestamp: new Date().toISOString(),
          };
        }
        
        const response = intentValidation.warning 
          ? `${intentValidation.warning} Let's start your ${routineType} routine!`
          : `Let's start your ${routineType} routine! I'll guide you through it.`;
        
        await this.storeMessage(session.id, userId, 'user', req.message, session.type);
        await this.storeMessage(session.id, userId, 'assistant', response, session.type);
        
        return {
          response,
          sessionId: session.id,
          timestamp: new Date().toISOString(),
          suggestedActions: suggestedAction ? [suggestedAction] : undefined,
          context: { timeOfDay },
        };
      }
      
      if (suggestedAction) {
        const response = this.getActionConfirmationMessage(detectedIntent.intent, detectedIntent.entities);
        
        await this.storeMessage(session.id, userId, 'user', req.message, session.type);
        await this.storeMessage(session.id, userId, 'assistant', response, session.type);
        
        return {
          response,
          sessionId: session.id,
          timestamp: new Date().toISOString(),
          suggestedActions: [suggestedAction],
          context: { timeOfDay },
        };
      }
    }
    
    const providerInput: NormalizedConversationInput = {
      userId,
      sessionId: session.id,
      type: session.type as any,
      message: req.message,
    };
    
    const providerResponse = await this.provider.sendMessage(providerInput);
    
    await this.storeMessage(session.id, userId, 'user', req.message, session.type);
    await this.storeMessage(session.id, userId, 'assistant', providerResponse.response, session.type);
    
    const updatedSession = await this.getSession(session.id);
    const autoComplete = shouldAutoCompleteSession(updatedSession);
    if (autoComplete.shouldComplete) {
      await this.completeSession(session.id);
    }
    
    await this.userData.incrementInteractionCount(userId);
    
    return {
      response: providerResponse.response,
      sessionId: session.id,
      timestamp: new Date().toISOString(),
      suggestedActions: providerResponse.suggestedActions,
      emotionalTone: providerResponse.emotionalTone,
      context: { ...providerResponse.context, timeOfDay },
    };
  }

  async getSessions(userId: string): Promise<ConversationSession[]> {
    const sessions = await this.sessionData.getRecentSessions(userId, 20);
    
    return sessions.map(s => ({
      id: s.id,
      userId: s.userId,
      type: s.sessionType,
      currentStep: s.currentStep,
      context: s.context,
      startedAt: s.startedAt.toISOString(),
      lastActivityAt: s.lastActivityAt.toISOString(),
      completed: s.completed,
    }));
  }

  async getSessionMessages(userId: string, sessionId: string): Promise<Message[]> {
    const messages = await this.conversationData.getConversationHistory(userId, sessionId);
    
    const result: Message[] = [];
    for (const msg of messages) {
      if (msg.userMessage) {
        result.push({
          role: 'user',
          content: msg.userMessage,
          timestamp: msg.createdAt.toISOString(),
        });
      }
      result.push({
        role: 'assistant',
        content: msg.emmaResponse,
        timestamp: msg.createdAt.toISOString(),
      });
    }
    
    return result.reverse();
  }

  async endSession(userId: string, sessionId: string, req: EndSessionRequest): Promise<EndSessionResponse> {
    const session = await this.getSession(sessionId);
    
    const summary = req.generateSummary 
      ? generateSessionSummary(session)
      : undefined;
    
    await this.completeSession(sessionId);
    
    const result = await this.provider.endSession(sessionId, req.generateSummary);
    
    return {
      summary: summary || result.summary,
      insights: result.insights,
      duration: result.duration,
      messageCount: result.messageCount,
    };
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    throw new Error('deleteSession() not yet implemented - requires database deletion logic');
  }

  async getMemory(userId: string): Promise<ConversationMemory> {
    if (this.provider.getMemory) {
      const providerMemory = await this.provider.getMemory(userId);
      return {
        shortTerm: providerMemory.shortTerm || [],
        longTerm: providerMemory.longTerm || [],
      };
    }
    
    throw new Error('getMemory() not yet implemented - requires database integration');
  }

  async clearMemory(userId: string): Promise<void> {
    if (this.provider.clearMemory) {
      await this.provider.clearMemory(userId);
    }
    
    throw new Error('clearMemory() not yet implemented - requires database integration');
  }

  private async getUserProfile(userId: string): Promise<{
    name: string;
    timezone: string;
    currentStreak?: number;
    lastCheckInDate?: string;
    recentMood?: number;
    preferences?: Record<string, any>;
  }> {
    let profile = await this.userData.getUserProfile(userId);
    
    if (!profile) {
      profile = await this.userData.createUserProfile({
        userId,
        name: 'User',
        timezone: 'America/New_York',
      });
    }
    
    const streak = await this.userData.getUserStreak(userId);
    const recentMood = await this.userData.getRecentMood(userId);
    
    return {
      name: profile.name,
      timezone: profile.timezone,
      currentStreak: streak.currentStreak,
      lastCheckInDate: streak.lastCheckInDate,
      recentMood: recentMood?.moodScore,
      preferences: {
        ...profile.morningRoutinePreferences,
        morningRoutineTime: profile.wakeTime,
      },
    };
  }

  private async getOrCreateSession(
    userId: string,
    sessionType: string,
    timeOfDay: TimeOfDay
  ): Promise<SessionState> {
    const existingSession = await this.sessionData.getActiveSession(userId, sessionType as SessionType);
    
    if (existingSession) {
      const canResume = canResumeSession(
        {
          id: existingSession.id,
          userId: existingSession.userId,
          type: existingSession.sessionType,
          startedAt: existingSession.startedAt.toISOString(),
          lastMessageAt: existingSession.lastActivityAt.toISOString(),
          messageCount: existingSession.messageCount,
          completed: existingSession.completed,
          context: existingSession.context,
        },
        new Date()
      );
      
      if (canResume.canResume) {
        return {
          id: existingSession.id,
          userId: existingSession.userId,
          type: existingSession.sessionType,
          startedAt: existingSession.startedAt.toISOString(),
          lastMessageAt: existingSession.lastActivityAt.toISOString(),
          messageCount: existingSession.messageCount,
          completed: existingSession.completed,
          context: existingSession.context,
        };
      }
    }
    
    const newSession = await this.sessionData.createSession(userId, sessionType as SessionType, {
      timeOfDay,
    });
    
    return {
      id: newSession.id,
      userId: newSession.userId,
      type: newSession.sessionType,
      startedAt: newSession.startedAt.toISOString(),
      lastMessageAt: newSession.lastActivityAt.toISOString(),
      messageCount: 0,
      completed: false,
      context: { timeOfDay },
    };
  }

  private async getSession(sessionId: string): Promise<SessionState> {
    const session = await this.sessionData.getSessionById(sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    return {
      id: session.id,
      userId: session.userId,
      type: session.sessionType,
      startedAt: session.startedAt.toISOString(),
      lastMessageAt: session.lastActivityAt.toISOString(),
      messageCount: session.messageCount,
      completed: session.completed,
      context: session.context,
    };
  }

  private async storeMessage(
    sessionId: string,
    userId: string,
    role: 'user' | 'assistant',
    content: string,
    conversationType: SessionType
  ): Promise<void> {
    await this.conversationData.storeMessage({
      userId,
      sessionId,
      conversationType,
      userMessage: role === 'user' ? content : undefined,
      emmaResponse: role === 'assistant' ? content : undefined,
      context: { role },
    });
    
    await this.sessionData.updateSession(sessionId, {});
  }

  private async completeSession(sessionId: string): Promise<void> {
    await this.sessionData.endSession(sessionId);
  }

  private getActionConfirmationMessage(intent: IntentType, entities: Record<string, any>): string {
    switch (intent) {
      case 'log_mood':
        if (entities.detectedMood) {
          return `I understand you're feeling ${entities.detectedMood}. Would you like me to log that for you?`;
        }
        return `I can help you log your mood. How are you feeling on a scale of 1-10?`;
      
      case 'track_meal':
        if (entities.foods) {
          return `Got it! You had ${entities.foods} for ${entities.mealType}. Would you like me to track that?`;
        }
        return `I can help you track your meal. What did you eat?`;
      
      case 'track_medication':
        return `I can help you log your medication. Which medication did you take?`;
      
      case 'add_journal_entry':
        return `I can add that to your wellness journal. What would you like to write about?`;
      
      default:
        return `I can help with that! What would you like to do?`;
    }
  }
}

export const conversationService = new ConversationService();
