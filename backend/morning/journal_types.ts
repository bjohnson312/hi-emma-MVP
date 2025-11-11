export type MorningJournalEntryType = 
  | "activity_added" 
  | "activity_completed" 
  | "routine_created" 
  | "routine_edited" 
  | "routine_selected"
  | "all_activities_completed";

export interface MorningJournalEntry {
  id: number;
  user_id: string;
  entry_type: MorningJournalEntryType;
  entry_text: string;
  activity_name?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface AddJournalEntryRequest {
  user_id: string;
  entry_type: MorningJournalEntryType;
  entry_text: string;
  activity_name?: string;
  metadata?: Record<string, any>;
}

export interface GetJournalEntriesRequest {
  user_id: string;
  days?: number;
  entry_type?: MorningJournalEntryType;
}

export interface GetJournalEntriesResponse {
  entries: MorningJournalEntry[];
}
