export interface ProviderChatRequest {
  provider_id: string;
  user_message: string;
  session_id?: number;
}

export interface ProviderChatResponse {
  emma_reply: string;
  session_id: number;
  conversation_complete: boolean;
}

export interface ProviderChatSession {
  id: number;
  provider_id: string;
  context: Record<string, any>;
  started_at: Date;
  last_activity_at: Date;
  completed: boolean;
}
