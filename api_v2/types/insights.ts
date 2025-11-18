export type SuggestionType = 'routine' | 'mood' | 'nutrition' | 'medication' | 'general';
export type SuggestionPriority = 'low' | 'medium' | 'high';

export interface Suggestion {
  id: string;
  userId: string;
  type: SuggestionType;
  title: string;
  description: string;
  priority: SuggestionPriority;
  actionable: boolean;
  action?: SuggestionAction;
  createdAt: string;
  appliedAt?: string;
  dismissedAt?: string;
  sourceConversationId?: string;
}

export interface SuggestionAction {
  type: string;
  params: any;
  description: string;
}

export interface ApplySuggestionResponse {
  applied: boolean;
  actions: string[];
  result: any;
}

export interface DismissSuggestionRequest {
  reason?: string;
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
  total: number;
  priorityOrder: Suggestion[];
}

export interface ConversationInsights {
  conversationId: string;
  intents: DetectedIntent[];
  topics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  suggestions: Suggestion[];
  generatedAt: string;
}

export interface DetectedIntent {
  intent: string;
  confidence: number;
  entities?: Record<string, any>;
}
