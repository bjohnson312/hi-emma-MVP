import type {
  ApiResponse,
  SendMessageRequest,
  SendMessageResponse,
  SessionsResponse,
  MessagesResponse,
  EndSessionRequest,
  EndSessionResponse,
  ConversationMemory,
} from '../types';

export const conversationRoutes = {
  send: async (req: SendMessageRequest): Promise<ApiResponse<SendMessageResponse>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Send message not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getSessions: async (): Promise<ApiResponse<SessionsResponse>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get sessions not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getSession: async (id: string): Promise<ApiResponse<MessagesResponse>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get session not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  endSession: async (id: string, req: EndSessionRequest): Promise<ApiResponse<EndSessionResponse>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'End session not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  deleteSession: async (id: string): Promise<ApiResponse<void>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Delete session not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getMemory: async (): Promise<ApiResponse<ConversationMemory>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get memory not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  clearMemory: async (): Promise<ApiResponse<void>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Clear memory not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
};
