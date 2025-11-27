export interface Message {
  id: number;
  created_at: Date;
  channel: 'sms' | 'email' | 'push' | 'browser';
  direction: 'inbound' | 'outbound';
  to: string;
  from: string;
  body: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'received';
  error?: string | null;
  external_id?: string | null;
  metadata?: Record<string, any>;
  user_id?: string | null;
  template_name?: string | null;
}

export interface SendTestSMSRequest {
  to: string;
  body: string;
}

export interface SendTestSMSResponse {
  success: boolean;
  message_id?: number;
  external_id?: string;
  error?: string;
}

export interface ListMessagesRequest {
  limit?: number;
  offset?: number;
  channel?: 'sms' | 'email' | 'push' | 'browser';
  direction?: 'inbound' | 'outbound';
}

export interface ListMessagesResponse {
  messages: Message[];
  total: number;
  has_more: boolean;
}
