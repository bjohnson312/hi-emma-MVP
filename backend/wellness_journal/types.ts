export type JournalEntryType = "daily_summary" | "milestone" | "insight" | "event";
export type SourceType = "morning_routine" | "evening_routine" | "mood" | "nutrition" | "medication" | "conversation" | "manual";

export interface WellnessJournalEntry {
  id: number;
  user_id: string;
  entry_date: Date;
  entry_type: JournalEntryType;
  title: string;
  content: string;
  mood_rating?: number;
  energy_level?: number;
  sleep_quality?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  source_type?: SourceType;
  source_id?: number;
  ai_generated: boolean;
  chapter_id?: number;
  section_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateJournalEntryRequest {
  user_id: string;
  entry_date?: Date;
  entry_type: JournalEntryType;
  title: string;
  content: string;
  mood_rating?: number;
  energy_level?: number;
  sleep_quality?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  source_type?: SourceType;
  source_id?: number;
  ai_generated?: boolean;
}

export interface GetJournalEntriesRequest {
  user_id: string;
  start_date?: Date;
  end_date?: Date;
  entry_type?: JournalEntryType;
  tags?: string[];
  limit?: number;
}

export interface GetJournalEntriesResponse {
  entries: WellnessJournalEntry[];
  total_count: number;
}

export interface GetDailySummaryRequest {
  user_id: string;
  date?: Date;
}

export interface DailySummaryData {
  date: Date;
  morning_routine?: {
    sleep_quality?: string;
    selected_action?: string;
    notes?: string;
  };
  evening_routine?: {
    wind_down_activities?: string[];
    screen_time_minutes?: number;
    bedtime?: string;
  };
  mood_logs: Array<{
    mood_rating: number;
    energy_level?: number;
    stress_level?: number;
    notes?: string;
  }>;
  meals: Array<{
    meal_type: string;
    description: string;
    energy_level?: number;
  }>;
  medications: Array<{
    medication_name: string;
    taken_at: Date;
  }>;
  conversation_highlights?: string[];
}

export interface GenerateDailySummaryResponse {
  summary: WellnessJournalEntry;
  data: DailySummaryData;
}

export interface GetJournalStatsRequest {
  user_id: string;
  start_date?: Date;
  end_date?: Date;
}

export interface JournalStats {
  total_entries: number;
  entries_by_type: Record<JournalEntryType, number>;
  avg_mood_rating?: number;
  avg_energy_level?: number;
  most_common_tags: Array<{ tag: string; count: number }>;
  streak_days: number;
  last_entry_date?: Date;
}

export interface WellnessChapter {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  motivation?: string;
  target_outcome?: string;
  start_date: Date;
  completion_vision?: string;
  is_active: boolean;
  is_completed: boolean;
  completed_at?: Date;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

export interface WellnessSection {
  id: number;
  chapter_id: number;
  title: string;
  description?: string;
  habit_type?: string;
  tracking_frequency?: "daily" | "weekly" | "as_needed";
  target_count?: number;
  is_active: boolean;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

export interface SectionLog {
  id: number;
  section_id: number;
  user_id: string;
  log_date: Date;
  completed: boolean;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface CreateChapterRequest {
  user_id: string;
  title: string;
  description?: string;
  motivation?: string;
  target_outcome?: string;
  completion_vision?: string;
}

export interface UpdateChapterRequest {
  chapter_id: number;
  user_id: string;
  title?: string;
  description?: string;
  motivation?: string;
  target_outcome?: string;
  completion_vision?: string;
  is_active?: boolean;
  is_completed?: boolean;
}

export interface CreateSectionRequest {
  chapter_id: number;
  user_id: string;
  title: string;
  description?: string;
  habit_type?: string;
  tracking_frequency?: "daily" | "weekly" | "as_needed";
  target_count?: number;
}

export interface UpdateSectionRequest {
  section_id: number;
  user_id: string;
  title?: string;
  description?: string;
  is_active?: boolean;
}

export interface LogSectionCompletionRequest {
  section_id: number;
  user_id: string;
  completed: boolean;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface GetChaptersRequest {
  user_id: string;
  include_completed?: boolean;
}

export interface GetChaptersResponse {
  chapters: (WellnessChapter & { section_count?: number; progress_percentage?: number })[];
}

export interface GetChapterDetailsRequest {
  chapter_id: number;
  user_id: string;
}

export interface GetChapterDetailsResponse {
  chapter: WellnessChapter;
  sections: (WellnessSection & { completion_count?: number; completion_percentage?: number })[];
  recent_entries: WellnessJournalEntry[];
  progress_percentage: number;
}

export interface ChapterInsight {
  chapter_id: number;
  insight_text: string;
  metric_type: string;
  metric_value: any;
  generated_at: Date;
}
