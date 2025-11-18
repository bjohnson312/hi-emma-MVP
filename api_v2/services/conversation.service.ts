import type {
  SendMessageRequest,
  SendMessageResponse,
  ConversationSession,
  Message,
  EndSessionRequest,
  EndSessionResponse,
  ConversationMemory,
} from '../types';
import { OpenAIProvider } from '../providers/openai.provider';
// import { VoiceflowProvider } from '../providers/voiceflow.provider';
import type {
  IConversationProvider,
  NormalizedConversationInput,
} from '../providers/provider.types';

/**
 * ConversationService - Provider-agnostic conversation management.
 * 
 * This service uses the Provider Adapter Pattern to abstract away
 * the underlying conversation provider (OpenAI, Voiceflow, etc.).
 * 
 * SWITCHING PROVIDERS:
 * To switch from OpenAI to Voiceflow, simply change line 33:
 *   private provider: IConversationProvider = new VoiceflowProvider();
 * 
 * All routes, types, and frontend code remain unchanged.
 * 
 * ARCHITECTURE BENEFITS:
 * 1. Provider-agnostic API routes
 * 2. Normalized request/response formats
 * 3. Easy A/B testing between providers
 * 4. Future-proof for new conversation engines
 * 5. Simplified testing (can mock provider)
 */
export class ConversationService {
  /**
   * Current conversation provider.
   * 
   * SWITCH PROVIDERS HERE:
   * - OpenAI: private provider = new OpenAIProvider();
   * - Voiceflow: private provider = new VoiceflowProvider();
   * - Or use environment variable: createConversationProvider(process.env.PROVIDER)
   */
  private provider: IConversationProvider = new OpenAIProvider();

  /**
   * Sends a message to the conversation provider.
   * 
   * This method:
   * 1. Normalizes the input for the provider
   * 2. Calls the provider's sendMessage method
   * 3. Returns the normalized output
   * 
   * @param userId - User ID sending the message
   * @param req - Message request from route
   * @returns Normalized conversation response
   */
  async sendMessage(userId: string, req: SendMessageRequest): Promise<SendMessageResponse> {
    // Normalize input for provider
    const normalizedInput: NormalizedConversationInput = {
      userId,
      sessionId: req.sessionId,
      type: req.type || 'general',
      message: req.message,
    };

    // Call provider and get normalized output
    const providerResponse = await this.provider.sendMessage(normalizedInput);

    // Map to SendMessageResponse (already normalized)
    const response: SendMessageResponse = {
      response: providerResponse.response,
      sessionId: providerResponse.sessionId,
      timestamp: new Date().toISOString(),
      suggestedActions: providerResponse.suggestedActions,
      emotionalTone: providerResponse.emotionalTone,
      context: providerResponse.context,
    };

    return response;
  }

  /**
   * Retrieves all conversation sessions for a user.
   * 
   * @param userId - User ID
   * @returns List of conversation sessions
   */
  async getSessions(userId: string): Promise<ConversationSession[]> {
    // TODO: Implement database query for user sessions
    // 
    // This is provider-agnostic - sessions are stored in our database
    // regardless of which conversation provider is used.
    // 
    // Steps:
    // 1. Query database for sessions where userId matches
    // 2. Order by lastMessageAt DESC
    // 3. Return sessions

    throw new Error('getSessions() not yet implemented - requires database integration');
  }

  /**
   * Retrieves all messages for a specific session.
   * 
   * @param userId - User ID (for authorization)
   * @param sessionId - Session ID to retrieve messages for
   * @returns List of messages in the session
   */
  async getSessionMessages(userId: string, sessionId: string): Promise<Message[]> {
    // TODO: Implement database query for session messages
    // 
    // This is provider-agnostic - messages are stored in our database.
    // 
    // Steps:
    // 1. Verify session belongs to userId
    // 2. Query messages for sessionId
    // 3. Order by timestamp ASC
    // 4. Return messages

    throw new Error('getSessionMessages() not yet implemented - requires database integration');
  }

  /**
   * Ends a conversation session.
   * 
   * @param userId - User ID
   * @param sessionId - Session ID to end
   * @param req - End session request (with optional summary generation)
   * @returns End session response with summary and insights
   */
  async endSession(userId: string, sessionId: string, req: EndSessionRequest): Promise<EndSessionResponse> {
    // Call provider to end session (may generate summary)
    const result = await this.provider.endSession(sessionId, req.generateSummary);

    // Map to EndSessionResponse
    const response: EndSessionResponse = {
      summary: result.summary,
      insights: result.insights,
      duration: result.duration,
      messageCount: result.messageCount,
    };

    return response;
  }

  /**
   * Deletes a conversation session and all its messages.
   * 
   * @param userId - User ID (for authorization)
   * @param sessionId - Session ID to delete
   */
  async deleteSession(userId: string, sessionId: string): Promise<void> {
    // TODO: Implement database deletion
    // 
    // This is provider-agnostic.
    // 
    // Steps:
    // 1. Verify session belongs to userId
    // 2. Delete all messages for sessionId
    // 3. Delete session record
    // 4. Optionally clear provider state (if provider supports it)

    throw new Error('deleteSession() not yet implemented - requires database integration');
  }

  /**
   * Retrieves conversation memory for a user.
   * 
   * @param userId - User ID
   * @returns User's conversation memory (short-term and long-term)
   */
  async getMemory(userId: string): Promise<ConversationMemory> {
    // Call provider to get memory (if supported)
    if (this.provider.getMemory) {
      const providerMemory = await this.provider.getMemory(userId);
      
      // Map to ConversationMemory format
      return {
        shortTerm: providerMemory.shortTerm || [],
        longTerm: providerMemory.longTerm || [],
      };
    }

    // Fallback: retrieve from database
    // TODO: Implement database-based memory retrieval
    throw new Error('getMemory() not yet implemented - requires database integration');
  }

  /**
   * Clears conversation memory for a user.
   * 
   * @param userId - User ID
   */
  async clearMemory(userId: string): Promise<void> {
    // Call provider to clear memory (if supported)
    if (this.provider.clearMemory) {
      await this.provider.clearMemory(userId);
    }

    // Also clear from database
    // TODO: Implement database memory clearing
    throw new Error('clearMemory() not yet implemented - requires database integration');
  }

  /**
   * Creates a new conversation session (used internally by sendMessage if needed).
   * 
   * @param userId - User ID
   * @param type - Conversation type
   * @returns New conversation session
   */
  private async createSession(userId: string, type: string): Promise<ConversationSession> {
    return await this.provider.createSession(userId, type);
  }
}

export const conversationService = new ConversationService();
