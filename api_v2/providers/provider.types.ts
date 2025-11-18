import type { ConversationSession, SuggestedAction } from '../types';

/**
 * Normalized input schema for all conversation providers.
 * This ensures that any provider (OpenAI, Voiceflow, etc.) receives the same input format.
 */
export interface NormalizedConversationInput {
  userId: string;
  sessionId?: string;
  type: 'general' | 'morning' | 'evening' | 'nutrition' | 'mood';
  message: string;
}

/**
 * Normalized output schema for all conversation providers.
 * This ensures consistent response format regardless of underlying provider.
 */
export interface NormalizedConversationOutput {
  response: string;
  sessionId: string;
  suggestedActions?: SuggestedAction[];
  emotionalTone?: string;
  context?: Record<string, any>;
}

/**
 * Base interface that all conversation providers must implement.
 * This enables swapping providers without changing service or route code.
 */
export interface IConversationProvider {
  /**
   * Sends a message to the conversation provider and returns a normalized response.
   */
  sendMessage(input: NormalizedConversationInput): Promise<NormalizedConversationOutput>;

  /**
   * Creates a new conversation session.
   */
  createSession(userId: string, type: string): Promise<ConversationSession>;

  /**
   * Ends a conversation session and optionally generates a summary.
   */
  endSession(sessionId: string, generateSummary?: boolean): Promise<{
    summary?: string;
    insights?: string[];
    duration: number;
    messageCount: number;
  }>;

  /**
   * Retrieves conversation memory for a user.
   */
  getMemory?(userId: string): Promise<any>;

  /**
   * Clears conversation memory for a user.
   */
  clearMemory?(userId: string): Promise<void>;
}

/**
 * Configuration options for conversation providers.
 */
export interface ProviderConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}
