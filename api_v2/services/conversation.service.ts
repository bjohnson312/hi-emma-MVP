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

// Import business logic
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
} from '../business/session';

/**
 * ConversationService - Provider-agnostic conversation management with business logic.
 * 
 * NEW ARCHITECTURE (Phase 1):
 * ===========================
 * 
 * This service now uses pure business logic functions from /business/ modules:
 * 
 * 1. Time-of-day classification (NO client-side Date usage)
 * 2. Greeting generation (NO frontend templates)
 * 3. Intent detection (BEFORE calling provider)
 * 4. Session management (Backend-driven state)
 * 
 * FLOW:
 * -----
 * Frontend calls → Routes → Service (HERE) → Business Logic → Provider (if needed)
 * 
 * SERVICE RESPONSIBILITIES:
 * - Get user data from database (TODO: implement DB calls)
 * - Call business logic functions (PURE, no I/O)
 * - Decide whether to call provider or return directly
 * - Post-process provider responses
 * - Store results in database
 * 
 * PROVIDER RESPONSIBILITIES (delegated):
 * - ONLY generate conversational responses
 * - NO business logic
 * - NO greeting generation
 * - NO time-of-day logic
 * 
 * FUTURE IMPLEMENTATION (Phase 2+):
 * - Replace TODO comments with actual database calls
 * - Add caching layer
 * - Add error handling and retry logic
 */
export class ConversationService {
  /**
   * Current conversation provider (OpenAI by default).
   * Can be switched to Voiceflow or any other provider.
   */
  private provider: IConversationProvider = new OpenAIProvider();

  /**
   * Sends a message in a conversation.
   * 
   * NEW LOGIC (Phase 1):
   * 1. Get user context (timezone, preferences) from DB
   * 2. Determine time of day using SERVER time + user timezone
   * 3. Check if this is first message → return greeting (NO provider call)
   * 4. Detect intent from message
   * 5. If high-confidence actionable intent → return action (NO provider call)
   * 6. Otherwise → call provider for conversational response
   * 7. Post-process response (extract journal entries, activities)
   * 
   * @param userId - User ID sending message
   * @param req - Message request
   * @returns Conversation response
   */
  async sendMessage(userId: string, req: SendMessageRequest): Promise<SendMessageResponse> {
    // STEP 1: Get user context from database
    // TODO: Replace with actual database call
    const userProfile = await this.getUserProfile(userId);
    const timezone = userProfile.timezone || 'America/New_York';
    const currentTime = new Date();
    
    // STEP 2: Determine time of day (BACKEND, not client)
    const timeOfDay = determineTimeOfDay(currentTime, timezone);
    
    // STEP 3: Get or create session
    const session = await this.getOrCreateSession(
      userId,
      req.sessionType || determineSessionType(req.sessionType as any, timeOfDay),
      timeOfDay
    );
    
    // STEP 4: If first message in session, return greeting (NO provider call)
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
      
      // Store greeting as first message
      await this.storeMessage(session.id, 'assistant', greeting);
      
      return {
        response: greeting,
        sessionId: session.id,
        timestamp: new Date().toISOString(),
        context: { timeOfDay, isGreeting: true },
      };
    }
    
    // STEP 5: Detect intent from user message (BACKEND logic)
    const detectedIntent = detectIntentFromMessage(req.message);
    
    // STEP 6: Validate intent against context
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
    
    // STEP 7: If actionable intent with high confidence, return action (NO provider call)
    if (shouldTriggerAction(detectedIntent)) {
      const suggestedAction = generateSuggestedAction(detectedIntent);
      
      // Special handling for routine start
      if (detectedIntent.intent === 'start_morning_routine' || detectedIntent.intent === 'start_evening_routine') {
        const routineType = detectedIntent.intent === 'start_morning_routine' ? 'morning' : 'evening';
        const shouldStart = shouldSuggestRoutine({
          routineType,
          currentTime,
          timezone,
          userPreferences: {
            morningRoutineTime: userProfile.preferences?.morningRoutineTime,
            eveningRoutineTime: userProfile.preferences?.eveningRoutineTime,
          },
          completedToday: false, // TODO: check database
        });
        
        if (!shouldStart.shouldSuggest) {
          return {
            response: shouldStart.reason,
            sessionId: session.id,
            timestamp: new Date().toISOString(),
          };
        }
        
        // Return action to start routine
        const response = intentValidation.warning 
          ? `${intentValidation.warning} Let's start your ${routineType} routine!`
          : `Let's start your ${routineType} routine! I'll guide you through it.`;
        
        await this.storeMessage(session.id, 'user', req.message);
        await this.storeMessage(session.id, 'assistant', response);
        
        return {
          response,
          sessionId: session.id,
          timestamp: new Date().toISOString(),
          suggestedActions: suggestedAction ? [suggestedAction] : undefined,
          context: { timeOfDay },
        };
      }
      
      // Other actionable intents (mood logging, meal tracking, etc.)
      if (suggestedAction) {
        const response = this.getActionConfirmationMessage(detectedIntent.intent, detectedIntent.entities);
        
        await this.storeMessage(session.id, 'user', req.message);
        await this.storeMessage(session.id, 'assistant', response);
        
        return {
          response,
          sessionId: session.id,
          timestamp: new Date().toISOString(),
          suggestedActions: [suggestedAction],
          context: { timeOfDay },
        };
      }
    }
    
    // STEP 8: Normal conversation → call provider
    const providerInput: NormalizedConversationInput = {
      userId,
      sessionId: session.id,
      type: session.type as any,
      message: req.message,
    };
    
    const providerResponse = await this.provider.sendMessage(providerInput);
    
    // STEP 9: Post-process provider response
    // TODO: Detect JOURNAL_ENTRY and ADD_ROUTINE_ACTIVITY tags
    
    // STEP 10: Store messages
    await this.storeMessage(session.id, 'user', req.message);
    await this.storeMessage(session.id, 'assistant', providerResponse.response);
    
    // STEP 11: Check if session should auto-complete
    const updatedSession = await this.getSession(session.id);
    const autoComplete = shouldAutoCompleteSession(updatedSession);
    if (autoComplete.shouldComplete) {
      await this.completeSession(session.id);
    }
    
    return {
      response: providerResponse.response,
      sessionId: session.id,
      timestamp: new Date().toISOString(),
      suggestedActions: providerResponse.suggestedActions,
      emotionalTone: providerResponse.emotionalTone,
      context: { ...providerResponse.context, timeOfDay },
    };
  }

  /**
   * Retrieves all conversation sessions for a user.
   * 
   * TODO: Implement database query
   */
  async getSessions(userId: string): Promise<ConversationSession[]> {
    throw new Error('getSessions() not yet implemented - requires database integration');
  }

  /**
   * Retrieves all messages for a specific session.
   * 
   * TODO: Implement database query
   */
  async getSessionMessages(userId: string, sessionId: string): Promise<Message[]> {
    throw new Error('getSessionMessages() not yet implemented - requires database integration');
  }

  /**
   * Ends a conversation session.
   */
  async endSession(userId: string, sessionId: string, req: EndSessionRequest): Promise<EndSessionResponse> {
    const session = await this.getSession(sessionId);
    
    // Generate summary
    const summary = req.generateSummary 
      ? generateSessionSummary(session)
      : undefined;
    
    // Mark as complete
    await this.completeSession(sessionId);
    
    // Call provider to end session (may generate insights)
    const result = await this.provider.endSession(sessionId, req.generateSummary);
    
    return {
      summary: summary || result.summary,
      insights: result.insights,
      duration: result.duration,
      messageCount: result.messageCount,
    };
  }

  /**
   * Deletes a conversation session.
   * 
   * TODO: Implement database deletion
   */
  async deleteSession(userId: string, sessionId: string): Promise<void> {
    throw new Error('deleteSession() not yet implemented - requires database integration');
  }

  /**
   * Retrieves conversation memory.
   */
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

  /**
   * Clears conversation memory.
   */
  async clearMemory(userId: string): Promise<void> {
    if (this.provider.clearMemory) {
      await this.provider.clearMemory(userId);
    }
    
    throw new Error('clearMemory() not yet implemented - requires database integration');
  }

  // ==================== Private Helper Methods ====================

  /**
   * Gets user profile from database.
   * 
   * TODO: Replace with actual database query
   */
  private async getUserProfile(userId: string): Promise<{
    name: string;
    timezone: string;
    currentStreak?: number;
    lastCheckInDate?: string;
    recentMood?: number;
    preferences?: Record<string, any>;
  }> {
    // Placeholder: return mock data
    return {
      name: 'User',
      timezone: 'America/New_York',
      currentStreak: 0,
      preferences: {},
    };
  }

  /**
   * Gets or creates a conversation session.
   * 
   * TODO: Replace with actual database query/insert
   */
  private async getOrCreateSession(
    userId: string,
    sessionType: string,
    timeOfDay: TimeOfDay
  ): Promise<SessionState> {
    // TODO: Check for existing session today
    // const existingSession = await db.query(...)
    
    // Placeholder: create new session
    const newSession: SessionState = {
      id: this.generateSessionId(),
      userId,
      type: sessionType as any,
      startedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      messageCount: 0,
      completed: false,
      context: {
        timeOfDay,
      },
    };
    
    // TODO: Store in database
    
    return newSession;
  }

  /**
   * Gets a session by ID.
   * 
   * TODO: Replace with actual database query
   */
  private async getSession(sessionId: string): Promise<SessionState> {
    // Placeholder
    return {
      id: sessionId,
      userId: 'placeholder',
      type: 'general',
      startedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      messageCount: 0,
      completed: false,
      context: { timeOfDay: 'morning' },
    };
  }

  /**
   * Stores a message in the database.
   * 
   * TODO: Replace with actual database insert
   */
  private async storeMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    // TODO: Insert into conversation_history table
    // TODO: Update session.messageCount
    // TODO: Update session.lastMessageAt
  }

  /**
   * Marks session as complete.
   * 
   * TODO: Replace with actual database update
   */
  private async completeSession(sessionId: string): Promise<void> {
    // TODO: UPDATE conversation_sessions SET completed = true
  }

  /**
   * Generates a unique session ID.
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets confirmation message for detected action.
   */
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
