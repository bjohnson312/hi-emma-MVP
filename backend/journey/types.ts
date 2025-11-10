export interface WellnessJourneySetup {
  id: number;
  user_id: string;
  wellness_journal_setup: boolean;
  wellness_journal_chapter_created: boolean;
  morning_routine_completed: boolean;
  evening_routine_completed: boolean;
  diet_nutrition_setup: boolean;
  doctors_orders_added: boolean;
  care_team_added: boolean;
  notifications_configured: boolean;
  user_profile_completed: boolean;
  first_conversation: boolean;
  setup_started_at: Date;
  setup_completed_at?: Date;
  last_updated: Date;
}

export interface WellnessMilestone {
  id: number;
  user_id: string;
  milestone_type: string;
  milestone_name: string;
  milestone_description?: string;
  badge_icon?: string;
  badge_color?: string;
  earned_at: Date;
  metadata?: Record<string, any>;
}

export interface GetJourneySetupRequest {
  user_id: string;
}

export interface GetJourneySetupResponse {
  setup: WellnessJourneySetup;
  completion_percentage: number;
  setup_steps_completed: number;
  total_setup_steps: number;
  incomplete_steps: string[];
}

export interface UpdateJourneySetupRequest {
  user_id: string;
  wellness_journal_setup?: boolean;
  wellness_journal_chapter_created?: boolean;
  morning_routine_completed?: boolean;
  evening_routine_completed?: boolean;
  diet_nutrition_setup?: boolean;
  doctors_orders_added?: boolean;
  care_team_added?: boolean;
  notifications_configured?: boolean;
  user_profile_completed?: boolean;
  first_conversation?: boolean;
}

export interface GetMilestonesRequest {
  user_id: string;
  limit?: number;
}

export interface GetMilestonesResponse {
  milestones: WellnessMilestone[];
  total_count: number;
}

export interface CreateMilestoneRequest {
  user_id: string;
  milestone_type: string;
  milestone_name: string;
  milestone_description?: string;
  badge_icon?: string;
  badge_color?: string;
  metadata?: Record<string, any>;
}
