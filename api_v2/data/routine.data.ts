import db from '../../backend/db';

export interface RoutinePreferences {
  userId: string;
  routineName?: string;
  activities: Array<{
    name: string;
    duration?: number;
    order: number;
  }>;
  wakeTime?: string;
  durationMinutes?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutineCompletion {
  id: string;
  userId: string;
  completionDate: Date;
  activitiesCompleted: Array<{
    name: string;
    completedAt?: string;
  }>;
  allCompleted: boolean;
  notes?: string;
  moodRating?: number;
  energyLevel?: number;
  createdAt: Date;
}

export interface RoutineStats {
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  averageMood?: number;
  averageEnergy?: number;
  completionRate: number;
  lastCompletionDate?: string;
}

export class RoutineDataAccess {
  async getRoutinePreferences(userId: string): Promise<RoutinePreferences | null> {
    const result = await db.query<{
      user_id: string;
      routine_name?: string;
      activities: any;
      wake_time?: string;
      duration_minutes?: number;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT user_id, routine_name, activities, wake_time, 
              duration_minutes, is_active, created_at, updated_at
       FROM morning_routine_preferences
       WHERE user_id = $1`,
      [userId]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      userId: row.user_id,
      routineName: row.routine_name,
      activities: row.activities || [],
      wakeTime: row.wake_time,
      durationMinutes: row.duration_minutes,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async saveRoutinePreferences(preferences: {
    userId: string;
    routineName?: string;
    activities: Array<{ name: string; duration?: number; order: number }>;
    wakeTime?: string;
    durationMinutes?: number;
    isActive?: boolean;
  }): Promise<void> {
    await db.query(
      `INSERT INTO morning_routine_preferences 
         (user_id, routine_name, activities, wake_time, duration_minutes, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         routine_name = EXCLUDED.routine_name,
         activities = EXCLUDED.activities,
         wake_time = EXCLUDED.wake_time,
         duration_minutes = EXCLUDED.duration_minutes,
         is_active = EXCLUDED.is_active,
         updated_at = NOW()`,
      [
        preferences.userId,
        preferences.routineName || null,
        JSON.stringify(preferences.activities),
        preferences.wakeTime || null,
        preferences.durationMinutes || null,
        preferences.isActive !== undefined ? preferences.isActive : true,
      ]
    );
  }

  async getRoutineCompletion(userId: string, date?: Date): Promise<RoutineCompletion | null> {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    const result = await db.query<{
      id: number;
      user_id: string;
      completion_date: Date;
      activities_completed: any;
      all_completed: boolean;
      notes?: string;
      mood_rating?: number;
      energy_level?: number;
      created_at: Date;
    }>(
      `SELECT id, user_id, completion_date, activities_completed,
              all_completed, notes, mood_rating, energy_level, created_at
       FROM morning_routine_completions
       WHERE user_id = $1 AND completion_date = $2`,
      [userId, dateStr]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id.toString(),
      userId: row.user_id,
      completionDate: row.completion_date,
      activitiesCompleted: row.activities_completed || [],
      allCompleted: row.all_completed,
      notes: row.notes,
      moodRating: row.mood_rating,
      energyLevel: row.energy_level,
      createdAt: row.created_at,
    };
  }

  async saveRoutineCompletion(completion: {
    userId: string;
    completionDate?: Date;
    activitiesCompleted: Array<{ name: string; completedAt?: string }>;
    allCompleted: boolean;
    notes?: string;
    moodRating?: number;
    energyLevel?: number;
  }): Promise<string> {
    const dateStr = (completion.completionDate || new Date()).toISOString().split('T')[0];

    const result = await db.query<{ id: number }>(
      `INSERT INTO morning_routine_completions
         (user_id, completion_date, activities_completed, all_completed, 
          notes, mood_rating, energy_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, completion_date) DO UPDATE SET
         activities_completed = EXCLUDED.activities_completed,
         all_completed = EXCLUDED.all_completed,
         notes = EXCLUDED.notes,
         mood_rating = EXCLUDED.mood_rating,
         energy_level = EXCLUDED.energy_level,
         created_at = NOW()
       RETURNING id`,
      [
        completion.userId,
        dateStr,
        JSON.stringify(completion.activitiesCompleted),
        completion.allCompleted,
        completion.notes || null,
        completion.moodRating || null,
        completion.energyLevel || null,
      ]
    );

    return result[0].id.toString();
  }

  async getRoutineStats(userId: string, days: number = 30): Promise<RoutineStats> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    const result = await db.query<{
      total_completions: string;
      avg_mood: string | null;
      avg_energy: string | null;
    }>(
      `SELECT 
         COUNT(*) as total_completions,
         AVG(mood_rating) as avg_mood,
         AVG(energy_level) as avg_energy
       FROM morning_routine_completions
       WHERE user_id = $1 
         AND all_completed = true
         AND completion_date >= $2`,
      [userId, sinceStr]
    );

    const totalCompletions = parseInt(result[0].total_completions);
    const avgMood = result[0].avg_mood ? parseFloat(result[0].avg_mood) : undefined;
    const avgEnergy = result[0].avg_energy ? parseFloat(result[0].avg_energy) : undefined;

    const streakResult = await db.query<{
      completion_date: Date;
    }>(
      `SELECT completion_date
       FROM morning_routine_completions
       WHERE user_id = $1 AND all_completed = true
       ORDER BY completion_date DESC
       LIMIT 365`,
      [userId]
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let lastCompletionDate: string | undefined;

    if (streakResult.length > 0) {
      const dates = streakResult.map(r => new Date(r.completion_date));
      lastCompletionDate = dates[0].toISOString().split('T')[0];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let tempStreak = 1;
      let previousDate: Date | null = null;

      for (let i = 0; i < dates.length; i++) {
        const currentDate = new Date(dates[i]);
        currentDate.setHours(0, 0, 0, 0);

        if (i === 0) {
          const daysSinceLast = Math.floor(
            (today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceLast === 0 || daysSinceLast === 1) {
            currentStreak = 1;
          }
        } else if (previousDate) {
          const daysDiff = Math.floor(
            (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
          );
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
    }

    const completionRate = days > 0 ? (totalCompletions / days) * 100 : 0;

    return {
      totalCompletions,
      currentStreak,
      longestStreak,
      averageMood: avgMood,
      averageEnergy: avgEnergy,
      completionRate: Math.min(100, completionRate),
      lastCompletionDate,
    };
  }

  async getRecentCompletions(userId: string, limit: number = 7): Promise<RoutineCompletion[]> {
    const result = await db.query<{
      id: number;
      user_id: string;
      completion_date: Date;
      activities_completed: any;
      all_completed: boolean;
      notes?: string;
      mood_rating?: number;
      energy_level?: number;
      created_at: Date;
    }>(
      `SELECT id, user_id, completion_date, activities_completed,
              all_completed, notes, mood_rating, energy_level, created_at
       FROM morning_routine_completions
       WHERE user_id = $1
       ORDER BY completion_date DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.map(row => ({
      id: row.id.toString(),
      userId: row.user_id,
      completionDate: row.completion_date,
      activitiesCompleted: row.activities_completed || [],
      allCompleted: row.all_completed,
      notes: row.notes,
      moodRating: row.mood_rating,
      energyLevel: row.energy_level,
      createdAt: row.created_at,
    }));
  }

  async isRoutineCompletedToday(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];

    const result = await db.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM morning_routine_completions
         WHERE user_id = $1 
           AND completion_date = $2 
           AND all_completed = true
       ) as exists`,
      [userId, today]
    );

    return result[0].exists;
  }
}
