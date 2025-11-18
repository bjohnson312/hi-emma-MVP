import db from '../../backend/db';

export interface UserProfile {
  id: string;
  name: string;
  timezone: string;
  email?: string;
  voicePreference?: string;
  onboardingCompleted: boolean;
  wakeTime?: string;
  interactionCount: number;
  lastInteractionAt?: Date;
  wellnessGoals: string[];
  dietaryPreferences: Record<string, any>;
  healthConditions: string[];
  lifestylePreferences: Record<string, any>;
  morningRoutinePreferences: Record<string, any>;
  notificationPreferences: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string;
  totalCheckIns: number;
}

export interface RecentMood {
  moodScore: number;
  timestamp: Date;
}

export class UserDataAccess {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const result = await db.query<{
      user_id: string;
      name: string;
      timezone: string;
      voice_preference?: string;
      onboarding_completed: boolean;
      wake_time?: string;
      interaction_count: number;
      last_interaction_at?: Date;
      wellness_goals: string[];
      dietary_preferences: Record<string, any>;
      health_conditions: string[];
      lifestyle_preferences: Record<string, any>;
      morning_routine_preferences: Record<string, any>;
      notification_preferences: Record<string, any>;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT 
        user_id, name, timezone, voice_preference, onboarding_completed,
        wake_time, interaction_count, last_interaction_at,
        wellness_goals, dietary_preferences, health_conditions,
        lifestyle_preferences, morning_routine_preferences,
        notification_preferences, created_at, updated_at
      FROM user_profiles
      WHERE user_id = $1`,
      [userId]
    );

    if (!result || result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.user_id,
      name: row.name,
      timezone: row.timezone || 'America/New_York',
      voicePreference: row.voice_preference,
      onboardingCompleted: row.onboarding_completed,
      wakeTime: row.wake_time,
      interactionCount: row.interaction_count,
      lastInteractionAt: row.last_interaction_at,
      wellnessGoals: row.wellness_goals || [],
      dietaryPreferences: row.dietary_preferences || {},
      healthConditions: row.health_conditions || [],
      lifestylePreferences: row.lifestyle_preferences || {},
      morningRoutinePreferences: row.morning_routine_preferences || {},
      notificationPreferences: row.notification_preferences || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async createUserProfile(data: {
    userId: string;
    name: string;
    timezone?: string;
    email?: string;
  }): Promise<UserProfile> {
    const timezone = data.timezone || 'America/New_York';
    
    const result = await db.query<{
      user_id: string;
      name: string;
      timezone: string;
      voice_preference?: string;
      onboarding_completed: boolean;
      wake_time?: string;
      interaction_count: number;
      last_interaction_at?: Date;
      wellness_goals: string[];
      dietary_preferences: Record<string, any>;
      health_conditions: string[];
      lifestyle_preferences: Record<string, any>;
      morning_routine_preferences: Record<string, any>;
      notification_preferences: Record<string, any>;
      created_at: Date;
      updated_at: Date;
    }>(
      `INSERT INTO user_profiles (user_id, name, timezone)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET
         name = EXCLUDED.name,
         timezone = EXCLUDED.timezone,
         updated_at = NOW()
       RETURNING 
         user_id, name, timezone, voice_preference, onboarding_completed,
         wake_time, interaction_count, last_interaction_at,
         wellness_goals, dietary_preferences, health_conditions,
         lifestyle_preferences, morning_routine_preferences,
         notification_preferences, created_at, updated_at`,
      [data.userId, data.name, timezone]
    );

    if (!result || result.length === 0) {
      throw new Error('Failed to create user profile');
    }

    const row = result[0];
    return {
      id: row.user_id,
      name: row.name,
      timezone: row.timezone || 'America/New_York',
      voicePreference: row.voice_preference,
      onboardingCompleted: row.onboarding_completed || false,
      wakeTime: row.wake_time,
      interactionCount: row.interaction_count || 0,
      lastInteractionAt: row.last_interaction_at,
      wellnessGoals: row.wellness_goals || [],
      dietaryPreferences: row.dietary_preferences || {},
      healthConditions: row.health_conditions || [],
      lifestylePreferences: row.lifestyle_preferences || {},
      morningRoutinePreferences: row.morning_routine_preferences || {},
      notificationPreferences: row.notification_preferences || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async updateUserProfile(userId: string, updates: {
    name?: string;
    timezone?: string;
    voicePreference?: string;
    wakeTime?: string;
    wellnessGoals?: string[];
    dietaryPreferences?: Record<string, any>;
    healthConditions?: string[];
    lifestylePreferences?: Record<string, any>;
    morningRoutinePreferences?: Record<string, any>;
    notificationPreferences?: Record<string, any>;
  }): Promise<void> {
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.timezone !== undefined) {
      setClauses.push(`timezone = $${paramCount++}`);
      values.push(updates.timezone);
    }
    if (updates.voicePreference !== undefined) {
      setClauses.push(`voice_preference = $${paramCount++}`);
      values.push(updates.voicePreference);
    }
    if (updates.wakeTime !== undefined) {
      setClauses.push(`wake_time = $${paramCount++}`);
      values.push(updates.wakeTime);
    }
    if (updates.wellnessGoals !== undefined) {
      setClauses.push(`wellness_goals = $${paramCount++}`);
      values.push(updates.wellnessGoals);
    }
    if (updates.dietaryPreferences !== undefined) {
      setClauses.push(`dietary_preferences = $${paramCount++}`);
      values.push(JSON.stringify(updates.dietaryPreferences));
    }
    if (updates.healthConditions !== undefined) {
      setClauses.push(`health_conditions = $${paramCount++}`);
      values.push(updates.healthConditions);
    }
    if (updates.lifestylePreferences !== undefined) {
      setClauses.push(`lifestyle_preferences = $${paramCount++}`);
      values.push(JSON.stringify(updates.lifestylePreferences));
    }
    if (updates.morningRoutinePreferences !== undefined) {
      setClauses.push(`morning_routine_preferences = $${paramCount++}`);
      values.push(JSON.stringify(updates.morningRoutinePreferences));
    }
    if (updates.notificationPreferences !== undefined) {
      setClauses.push(`notification_preferences = $${paramCount++}`);
      values.push(JSON.stringify(updates.notificationPreferences));
    }

    values.push(userId);

    await db.query(
      `UPDATE user_profiles
       SET ${setClauses.join(', ')}
       WHERE user_id = $${paramCount}`,
      values
    );
  }

  async incrementInteractionCount(userId: string): Promise<void> {
    await db.query(
      `UPDATE user_profiles
       SET interaction_count = interaction_count + 1,
           last_interaction_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
  }

  async getUserStreak(userId: string): Promise<UserStreak> {
    const completions = await db.query<{
      completion_date: Date;
    }>(
      `SELECT completion_date
       FROM morning_routine_completions
       WHERE user_id = $1 AND all_completed = true
       ORDER BY completion_date DESC
       LIMIT 365`,
      [userId]
    );

    if (completions.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastCheckInDate: '',
        totalCheckIns: 0,
      };
    }

    const dates = completions.map(c => new Date(c.completion_date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    let previousDate: Date | null = null;

    for (let i = 0; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      currentDate.setHours(0, 0, 0, 0);

      if (i === 0) {
        const daysSinceLast = Math.floor((today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLast === 0 || daysSinceLast === 1) {
          currentStreak = 1;
        }
      } else if (previousDate) {
        const daysDiff = Math.floor((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          tempStreak++;
          if (i === 1 && currentStreak > 0) {
            currentStreak = tempStreak;
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }

      previousDate = currentDate;
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    const lastCheckInDate = dates[0].toISOString().split('T')[0];

    return {
      currentStreak,
      longestStreak,
      lastCheckInDate,
      totalCheckIns: completions.length,
    };
  }

  async getRecentMood(userId: string): Promise<RecentMood | null> {
    const result = await db.query<{
      mood_rating: number;
      created_at: Date;
    }>(
      `SELECT mood_rating, created_at
       FROM morning_routine_completions
       WHERE user_id = $1 AND mood_rating IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.length === 0) {
      return null;
    }

    return {
      moodScore: result[0].mood_rating,
      timestamp: result[0].created_at,
    };
  }

  async getUserEmail(userId: string): Promise<string | null> {
    const result = await db.query<{ email: string }>(
      `SELECT email FROM users WHERE id = $1`,
      [userId]
    );

    return result.length > 0 ? result[0].email : null;
  }
}
