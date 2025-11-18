import type {
  ApiResponse,
  SuggestionsResponse,
  ApplySuggestionResponse,
  DismissSuggestionRequest,
  ConversationInsights,
} from '../types';

export const insightsRoutes = {
  getSuggestions: async (): Promise<ApiResponse<SuggestionsResponse>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get suggestions not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  applySuggestion: async (id: string): Promise<ApiResponse<ApplySuggestionResponse>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Apply suggestion not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  dismissSuggestion: async (id: string, req: DismissSuggestionRequest): Promise<ApiResponse<void>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Dismiss suggestion not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getConversationInsights: async (conversationId: string): Promise<ApiResponse<ConversationInsights>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get conversation insights not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
};
