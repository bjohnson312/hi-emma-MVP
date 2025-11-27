export interface UserProfile {
  id: number;
  user_id: string;
  name: string;
  name_pronunciation?: string | null;
  wake_time?: string;
  morning_routine_preferences?: {
    stretching?: boolean;
    gratitude?: boolean;
    music_genre?: string;
    meditation?: boolean;
  };
  timezone?: string;
  interaction_count?: number;
  last_interaction_at?: Date;
  onboarding_completed?: boolean;
  wellness_goals?: string[];
  dietary_preferences?: {
    restrictions?: string[];
    allergies?: string[];
    preferences?: string[];
  };
  health_conditions?: string[];
  lifestyle_preferences?: {
    exercise_frequency?: string;
    work_schedule?: string;
    hobbies?: string[];
    sleep_goal_hours?: number;
  };
  voice_preference?: string;
  notification_preferences?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProfileRequest {
  user_id: string;
  name: string;
  name_pronunciation?: string;
}

export interface UpdateProfileRequest {
  user_id: string;
  name?: string;
  name_pronunciation?: string;
}

export interface GetProfileRequest {
  user_id: string;
}

export interface ConversationEntry {
  id: number;
  user_id: string;
  conversation_type: "morning" | "evening" | "mood" | "diet" | "doctors_orders" | "general";
  user_message?: string;
  emma_response: string;
  context?: Record<string, any>;
  created_at: Date;
}

export interface LogConversationRequest {
  user_id: string;
  conversation_type: "morning" | "evening" | "mood" | "diet" | "doctors_orders" | "general";
  user_message?: string;
  emma_response: string;
  context?: Record<string, any>;
}

export interface GetConversationHistoryRequest {
  user_id: string;
  conversation_type?: string;
  limit?: number;
}

export interface BehaviorPattern {
  id: number;
  user_id: string;
  pattern_type: string;
  pattern_data: Record<string, any>;
  confidence_score: number;
  first_observed: Date;
  last_observed: Date;
  observation_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserInsight {
  id: number;
  user_id: string;
  insight_type: string;
  insight_category: string;
  title: string;
  description: string;
  recommendations: string[];
  data_points: Record<string, any>;
  generated_at: Date;
  acknowledged: boolean;
  acknowledged_at?: Date;
  created_at: Date;
}

export interface UserMilestone {
  id: number;
  user_id: string;
  milestone_type: string;
  title: string;
  description?: string;
  achieved_at: Date;
  metadata: Record<string, any>;
  created_at: Date;
}
