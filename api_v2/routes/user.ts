import type { ApiResponse, UserProfile, UserPreferences } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import {
  determineTimeOfDay,
  generateGreeting,
  shouldSuggestRoutine,
  type TimeOfDay,
} from '../business/routine';
import { UserDataAccess } from '../data/user.data';
import { SessionDataAccess } from '../data/session.data';
import { RoutineDataAccess } from '../data/routine.data';
import { canResumeSession } from '../business/session';

const userData = new UserDataAccess();
const sessionData = new SessionDataAccess();
const routineData = new RoutineDataAccess();

export const userRoutes = {
  getProfile: async (userId: string): Promise<ApiResponse<UserProfile>> => {
    try {
      const profile = await userData.getUserProfile(userId);
      
      if (!profile) {
        return errorResponse('USER_NOT_FOUND', 'User profile not found');
      }

      const email = await userData.getUserEmail(userId);
      
      return successResponse({
        userId: profile.id,
        name: profile.name,
        email: email || undefined,
        timezone: profile.timezone,
        onboardingCompleted: profile.onboardingCompleted,
        preferences: {
          voicePreference: profile.voicePreference,
          notificationPreferences: profile.notificationPreferences,
        },
        createdAt: profile.createdAt.toISOString(),
      });
    } catch (error: any) {
      return errorResponse('USER_ERROR', error.message);
    }
  },

  updateProfile: async (
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<ApiResponse<UserProfile>> => {
    try {
      await userData.updateUserProfile(userId, {
        name: updates.name,
        timezone: updates.timezone,
      });
      
      return userRoutes.getProfile(userId);
    } catch (error: any) {
      return errorResponse('USER_ERROR', error.message);
    }
  },

  getPreferences: async (userId: string): Promise<ApiResponse<UserPreferences>> => {
    try {
      const profile = await userData.getUserProfile(userId);
      
      if (!profile) {
        return errorResponse('USER_NOT_FOUND', 'User profile not found');
      }
      
      return successResponse({
        voicePreference: profile.voicePreference,
        notificationPreferences: profile.notificationPreferences,
        morningRoutinePreferences: profile.morningRoutinePreferences,
        wellnessGoals: profile.wellnessGoals,
        dietaryPreferences: profile.dietaryPreferences,
        healthConditions: profile.healthConditions,
        lifestylePreferences: profile.lifestylePreferences,
      });
    } catch (error: any) {
      return errorResponse('USER_ERROR', error.message);
    }
  },

  updatePreferences: async (
    userId: string,
    updates: Partial<UserPreferences>
  ): Promise<ApiResponse<UserPreferences>> => {
    try {
      await userData.updateUserProfile(userId, {
        voicePreference: updates.voicePreference,
        wellnessGoals: updates.wellnessGoals,
        dietaryPreferences: updates.dietaryPreferences,
        healthConditions: updates.healthConditions,
        lifestylePreferences: updates.lifestylePreferences,
        morningRoutinePreferences: updates.morningRoutinePreferences,
        notificationPreferences: updates.notificationPreferences,
      });
      
      return userRoutes.getPreferences(userId);
    } catch (error: any) {
      return errorResponse('USER_ERROR', error.message);
    }
  },

  getCurrentContext: async (userId: string): Promise<ApiResponse<{
    greeting: string;
    timeOfDay: TimeOfDay;
    suggestions: Array<{
      type: string;
      priority: 'high' | 'medium' | 'low';
      reason: string;
      action: {
        route: string;
        label: string;
        params?: Record<string, any>;
      };
    }>;
    activeSession?: {
      id: string;
      type: string;
      canResume: boolean;
      lastMessageAt: string;
      messageCount: number;
    };
  }>> => {
    try {
      let profile = await userData.getUserProfile(userId);
      
      if (!profile) {
        profile = await userData.createUserProfile({
          userId,
          name: 'User',
          timezone: 'America/New_York',
        });
      }
      
      const streak = await userData.getUserStreak(userId);
      const recentMood = await userData.getRecentMood(userId);
      
      const currentTime = new Date();
      const timeOfDay = determineTimeOfDay(currentTime, profile.timezone);
      
      const greeting = generateGreeting({
        userName: profile.name,
        timeOfDay,
        sessionType: 'general',
        isFirstCheckIn: true,
        userContext: {
          currentStreak: streak.currentStreak,
          lastCheckInDate: streak.lastCheckInDate,
          recentMood: recentMood?.moodScore,
        },
      });
      
      const suggestions: Array<{
        type: string;
        priority: 'high' | 'medium' | 'low';
        reason: string;
        action: {
          route: string;
          label: string;
          params?: Record<string, any>;
        };
      }> = [];
      
      const routinePrefs = await routineData.getRoutinePreferences(userId);
      const morningCompletedToday = await routineData.isRoutineCompletedToday(userId);
      
      const morningCheck = shouldSuggestRoutine({
        routineType: 'morning',
        currentTime,
        timezone: profile.timezone,
        userPreferences: {
          morningRoutineTime: routinePrefs?.wakeTime || profile.wakeTime,
          eveningRoutineTime: profile.morningRoutinePreferences?.eveningRoutineTime as string,
        },
        completedToday: morningCompletedToday,
      });
      
      if (morningCheck.shouldSuggest && morningCheck.priority !== 'low') {
        suggestions.push({
          type: 'start_morning_routine',
          priority: morningCheck.priority,
          reason: morningCheck.reason,
          action: {
            route: '/morning-routine',
            label: 'Start Morning Routine',
            params: { type: 'morning' },
          },
        });
      }
      
      const eveningCheck = shouldSuggestRoutine({
        routineType: 'evening',
        currentTime,
        timezone: profile.timezone,
        userPreferences: {
          morningRoutineTime: routinePrefs?.wakeTime || profile.wakeTime,
          eveningRoutineTime: profile.morningRoutinePreferences?.eveningRoutineTime as string,
        },
        completedToday: false,
      });
      
      if (eveningCheck.shouldSuggest && eveningCheck.priority !== 'low') {
        suggestions.push({
          type: 'start_evening_routine',
          priority: eveningCheck.priority,
          reason: eveningCheck.reason,
          action: {
            route: '/evening-routine',
            label: 'Start Evening Routine',
            params: { type: 'evening' },
          },
        });
      }
      
      const todaySessions = await sessionData.getTodaySessions(userId);
      let activeSession = undefined;
      
      if (todaySessions.length > 0) {
        const mostRecent = todaySessions[0];
        const canResume = canResumeSession(
          {
            id: mostRecent.id,
            userId: mostRecent.userId,
            type: mostRecent.sessionType,
            startedAt: mostRecent.startedAt.toISOString(),
            lastMessageAt: mostRecent.lastActivityAt.toISOString(),
            messageCount: mostRecent.messageCount,
            completed: mostRecent.completed,
            context: mostRecent.context,
          },
          currentTime
        );
        
        if (canResume.canResume) {
          activeSession = {
            id: mostRecent.id,
            type: mostRecent.sessionType,
            canResume: true,
            lastMessageAt: mostRecent.lastActivityAt.toISOString(),
            messageCount: mostRecent.messageCount,
          };
        }
      }
      
      return successResponse({
        greeting,
        timeOfDay,
        suggestions,
        activeSession,
      });
    } catch (error: any) {
      return errorResponse('CONTEXT_ERROR', error.message);
    }
  },

  getGreeting: async (userId: string): Promise<ApiResponse<{
    greeting: string;
    timeOfDay: TimeOfDay;
  }>> => {
    try {
      let profile = await userData.getUserProfile(userId);
      
      if (!profile) {
        profile = await userData.createUserProfile({
          userId,
          name: 'User',
          timezone: 'America/New_York',
        });
      }
      
      const currentTime = new Date();
      const timeOfDay = determineTimeOfDay(currentTime, profile.timezone);
      
      const greeting = generateGreeting({
        userName: profile.name,
        timeOfDay,
        sessionType: 'general',
        isFirstCheckIn: true,
      });
      
      return successResponse({ greeting, timeOfDay });
    } catch (error: any) {
      return errorResponse('GREETING_ERROR', error.message);
    }
  },
};
