export type SessionType = "morning" | "evening" | "mood" | "diet" | "doctors_orders" | "general";

export interface ConversationSession {
  id: number;
  user_id: string;
  session_type: SessionType;
  current_step?: string;
  context?: Record<string, any>;
  started_at: Date;
  last_activity_at: Date;
  completed: boolean;
  conversation_date?: Date;
}

export interface ChatRequest {
  user_id: string;
  session_type: SessionType;
  user_message: string;
  session_id?: number;
}

export interface ChatResponse {
  emma_reply: string;
  session_id: number;
  suggested_actions?: string[];
  next_step?: string;
  conversation_complete?: boolean;
  data_to_log?: Record<string, any>;
  journal_entry_created?: boolean;
}

export interface GetOrCreateSessionRequest {
  user_id: string;
  session_type: SessionType;
}
