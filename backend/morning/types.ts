export type SleepQuality = "good" | "okay" | "poor";
export type HabitAction = "stretch" | "deep_breath" | "gratitude_moment";
export type RoutinePreference = "gratitude" | "music";

export interface CheckInRequest {
  user_id: string;
  user_name?: string;
  user_response?: string;
  time_of_day?: string;
  step?: "greeting" | "process_name" | "process_response" | "offer_stretch" | "guide_stretch" | "routine_preference" | "wake_time";
  sleep_quality?: SleepQuality;
  wants_stretch?: boolean;
  routine_preference?: RoutinePreference;
  music_genre?: string;
  wake_up_time?: string;
}

export interface CheckInResponse {
  emma_reply: string;
  habit_suggestion?: HabitAction;
  log_data?: LogData;
  next_step?: "process_name" | "sleep_question" | "offer_stretch" | "guide_stretch" | "routine_preference" | "wake_time" | "complete";
  stretch_suggestions?: string[];
  show_yes_no?: boolean;
  show_routine_options?: boolean;
}

export interface LogData {
  user_id: string;
  date: Date;
  sleep_quality: SleepQuality;
  selected_action: HabitAction;
  notes?: string;
  routine_preference?: RoutinePreference;
  music_genre?: string;
  wake_up_time?: string;
}
