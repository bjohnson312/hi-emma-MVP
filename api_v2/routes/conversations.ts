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
import { conversationService } from '../services/conversation.service';
import { successResponse, errorResponse } from '../utils/response';

/**
 * Conversation routes - Provider-agnostic conversation endpoints.
 * 
 * These routes delegate to ConversationService, which uses the Provider
 * Adapter Pattern. The routes are completely independent of which
 * conversation provider (OpenAI, Voiceflow, etc.) is being used.
 * 
 * BENEFITS:
 * - Routes never change when switching providers
 * - Frontend code remains unchanged
 * - Mobile app will use identical endpoints
 * - Easy to test with mock providers
 */
export const conversationRoutes = {
  /**
   * Sends a message to the conversation provider.
   * 
   * POST /api/v2/conversations/send
   * Body: { message: string, sessionId?: string, type?: string }
   * 
   * @param req - Send message request
   * @param userId - User ID (from auth middleware)
   * @returns API response with conversation response
   */
  send: async (
    req: SendMessageRequest,
    userId: string
  ): Promise<ApiResponse<SendMessageResponse>> => {
    try {
      // Delegate to service (which delegates to provider)
      const response = await conversationService.sendMessage(userId, req);
      
      return successResponse(response);
    } catch (error: any) {
      return errorResponse(
        'CONVERSATION_ERROR',
        error.message || 'Failed to send message',
        { error: error.toString() }
      );
    }
  },

  /**
   * Retrieves all conversation sessions for the authenticated user.
   * 
   * GET /api/v2/conversations/sessions
   * 
   * @param userId - User ID (from auth middleware)
   * @returns API response with list of sessions
   */
  getSessions: async (userId: string): Promise<ApiResponse<SessionsResponse>> => {
    try {
      const sessions = await conversationService.getSessions(userId);
      
      return successResponse({
        sessions,
        total: sessions.length,
      });
    } catch (error: any) {
      return errorResponse(
        'CONVERSATION_ERROR',
        error.message || 'Failed to retrieve sessions',
        { error: error.toString() }
      );
    }
  },

  /**
   * Retrieves all messages for a specific session.
   * 
   * GET /api/v2/conversations/sessions/:id/messages
   * 
   * @param id - Session ID
   * @param userId - User ID (from auth middleware)
   * @returns API response with messages and session info
   */
  getSession: async (
    id: string,
    userId: string
  ): Promise<ApiResponse<MessagesResponse>> => {
    try {
      const messages = await conversationService.getSessionMessages(userId, id);
      
      // TODO: Retrieve session info from database
      const sessionInfo: any = {
        id,
        userId,
        type: 'general',
        startedAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        messageCount: messages.length,
      };

      return successResponse({
        messages,
        total: messages.length,
        sessionInfo,
      });
    } catch (error: any) {
      return errorResponse(
        'CONVERSATION_ERROR',
        error.message || 'Failed to retrieve session messages',
        { error: error.toString() }
      );
    }
  },

  /**
   * Ends a conversation session.
   * 
   * POST /api/v2/conversations/sessions/:id/end
   * Body: { generateSummary?: boolean }
   * 
   * @param id - Session ID
   * @param req - End session request
   * @param userId - User ID (from auth middleware)
   * @returns API response with session summary
   */
  endSession: async (
    id: string,
    req: EndSessionRequest,
    userId: string
  ): Promise<ApiResponse<EndSessionResponse>> => {
    try {
      const response = await conversationService.endSession(userId, id, req);
      
      return successResponse(response);
    } catch (error: any) {
      return errorResponse(
        'CONVERSATION_ERROR',
        error.message || 'Failed to end session',
        { error: error.toString() }
      );
    }
  },

  /**
   * Deletes a conversation session and all its messages.
   * 
   * DELETE /api/v2/conversations/sessions/:id
   * 
   * @param id - Session ID
   * @param userId - User ID (from auth middleware)
   * @returns API response confirming deletion
   */
  deleteSession: async (id: string, userId: string): Promise<ApiResponse<void>> => {
    try {
      await conversationService.deleteSession(userId, id);
      
      return successResponse(undefined);
    } catch (error: any) {
      return errorResponse(
        'CONVERSATION_ERROR',
        error.message || 'Failed to delete session',
        { error: error.toString() }
      );
    }
  },

  /**
   * Retrieves conversation memory for the authenticated user.
   * 
   * GET /api/v2/conversations/memory
   * 
   * @param userId - User ID (from auth middleware)
   * @returns API response with user's conversation memory
   */
  getMemory: async (userId: string): Promise<ApiResponse<ConversationMemory>> => {
    try {
      const memory = await conversationService.getMemory(userId);
      
      return successResponse(memory);
    } catch (error: any) {
      return errorResponse(
        'CONVERSATION_ERROR',
        error.message || 'Failed to retrieve memory',
        { error: error.toString() }
      );
    }
  },

  /**
   * Clears conversation memory for the authenticated user.
   * 
   * POST /api/v2/conversations/memory/clear
   * 
   * @param userId - User ID (from auth middleware)
   * @returns API response confirming memory cleared
   */
  clearMemory: async (userId: string): Promise<ApiResponse<void>> => {
    try {
      await conversationService.clearMemory(userId);
      
      return successResponse(undefined);
    } catch (error: any) {
      return errorResponse(
        'CONVERSATION_ERROR',
        error.message || 'Failed to clear memory',
        { error: error.toString() }
      );
    }
  },
};
