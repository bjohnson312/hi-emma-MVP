export interface MorningRoutineActivity {
  id: string;
  name: string;
  duration_minutes?: number;
  icon?: string;
  description?: string;
}

export interface MorningRoutinePreference {
  id: number;
  user_id: string;
  routine_name?: string;
  activities: MorningRoutineActivity[];
  wake_time?: string;
  duration_minutes?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MorningRoutineCompletion {
  id: number;
  user_id: string;
  completion_date: Date;
  activities_completed: string[];
  all_completed: boolean;
  notes?: string;
  mood_rating?: number;
  energy_level?: number;
  created_at: Date;
}

export interface CreateRoutinePreferenceRequest {
  user_id: string;
  routine_name?: string;
  activities: MorningRoutineActivity[];
  wake_time?: string;
  duration_minutes?: number;
}

export interface UpdateRoutinePreferenceRequest {
  user_id: string;
  routine_name?: string;
  activities?: MorningRoutineActivity[];
  wake_time?: string;
  duration_minutes?: number;
  is_active?: boolean;
}

export interface LogRoutineCompletionRequest {
  user_id: string;
  activities_completed: string[];
  all_completed: boolean;
  notes?: string;
  mood_rating?: number;
  energy_level?: number;
}

export interface GetRoutineStatsRequest {
  user_id: string;
  days?: number;
}

export interface RoutineStats {
  total_completions: number;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  avg_mood_rating?: number;
  avg_energy_level?: number;
  last_completion_date?: Date;
  days_with_activity: number;
  total_days: number;
}

export interface GetRoutinePreferenceRequest {
  user_id: string;
}

export interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  activities: MorningRoutineActivity[];
  duration_minutes: number;
  color: string;
}
