export type DataCategory = 
  | "morning_routine" 
  | "evening_routine" 
  | "mood" 
  | "nutrition" 
  | "medication" 
  | "conversations";

export interface ExportJournalRequest {
  user_id: string;
  start_date?: Date;
  end_date?: Date;
  format?: "json" | "text";
}

export interface JournalEntry {
  date: Date;
  category: string;
  content: Record<string, any>;
}

export interface ExportJournalResponse {
  user_name: string;
  export_date: Date;
  date_range: {
    start: Date;
    end: Date;
  };
  entries: JournalEntry[];
  summary: {
    total_entries: number;
    categories: Record<string, number>;
    morning_routines: number;
    evening_routines: number;
    mood_logs: number;
    meal_logs: number;
    medications_taken: number;
  };
}

export interface GenerateExportRequest {
  user_id: string;
  start_date: Date;
  end_date: Date;
  categories: DataCategory[];
  include_conversations: boolean;
}

export interface GenerateExportResponse {
  user_name: string;
  export_date: Date;
  date_range: {
    start: Date;
    end: Date;
  };
  included_categories: DataCategory[];
  entries: JournalEntry[];
  conversations?: ConversationEntry[];
  summary: {
    total_entries: number;
    categories: Record<string, number>;
  };
}

export interface ConversationEntry {
  date: Date;
  session_type: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
}

export interface CreateShareRequest {
  user_id: string;
  recipient_name?: string;
  recipient_email?: string;
  start_date: Date;
  end_date: Date;
  categories: DataCategory[];
  include_conversations: boolean;
  format: "json" | "pdf";
  expires_in_hours?: number;
  max_access_count?: number;
}

export interface CreateShareResponse {
  share_id: number;
  share_token: string;
  share_url: string;
  expires_at: Date;
  max_access_count: number;
}

export interface AccessShareRequest {
  share_token: string;
}

export interface AccessShareResponse {
  valid: boolean;
  data?: GenerateExportResponse;
  pdf_data?: string;
  format: "json" | "pdf";
  recipient_name?: string;
  expires_at?: Date;
  access_count?: number;
  max_access_count?: number;
}

export interface ListSharesRequest {
  user_id: string;
}

export interface ShareInfo {
  id: number;
  recipient_name?: string;
  recipient_email?: string;
  date_range: {
    start: Date;
    end: Date;
  };
  categories: DataCategory[];
  format: string;
  created_at: Date;
  expires_at: Date;
  access_count: number;
  max_access_count: number;
  active: boolean;
}

export interface ListSharesResponse {
  shares: ShareInfo[];
}

export interface RevokeShareRequest {
  user_id: string;
  share_id: number;
}

export interface GeneratePDFRequest {
  user_id: string;
  start_date: Date;
  end_date: Date;
  categories: DataCategory[];
  include_conversations: boolean;
  recipient_name?: string;
}

export interface GeneratePDFResponse {
  pdf_base64: string;
  filename: string;
}
