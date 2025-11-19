export type ConversationType = 'general' | 'morning' | 'evening' | 'nutrition' | 'mood';

export interface SendMessageRequest {
  message: string;
  sessionId?: string;
  type?: ConversationType;
  sessionType?: string;
}

export interface SendMessageResponse {
  response: string;
  sessionId: string;
  timestamp: string;
  suggestedActions?: SuggestedAction[];
  emotionalTone?: string;
  context?: ConversationContext;
  intent?: string;
  confidence?: number;
}

export interface SuggestedAction {
  id: string;
  label: string;
  action: string;
  params?: any;
}

export interface ConversationContext {
  mood?: number;
  topics?: string[];
  intents?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  routineState?: 'none' | 'suggest' | 'active' | 'completed';
  streak?: number;
  entities?: Record<string, any>;
  isGreeting?: boolean;
}

export interface ConversationSession {
  id: string;
  userId: string;
  type: ConversationType;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
  summary?: string;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SessionsResponse {
  sessions: ConversationSession[];
  total: number;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  sessionInfo: ConversationSession;
}

export interface EndSessionRequest {
  generateSummary?: boolean;
}

export interface EndSessionResponse {
  summary?: string;
  insights?: string[];
  duration: number;
  messageCount: number;
}

export interface ConversationMemory {
  shortTerm: MemoryItem[];
  longTerm: MemoryItem[];
}

export interface MemoryItem {
  id: string;
  content: string;
  type: 'fact' | 'preference' | 'goal' | 'concern';
  importance: number;
  createdAt: string;
  lastAccessed?: string;
}
