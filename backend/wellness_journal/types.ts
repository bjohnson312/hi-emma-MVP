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
