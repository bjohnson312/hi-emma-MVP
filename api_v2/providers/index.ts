export * from './provider.types';
export * from './openai.provider';
export * from './voiceflow.provider';

// Export a factory function for easy provider switching
import { OpenAIProvider } from './openai.provider';
import { VoiceflowProvider } from './voiceflow.provider';
import type { IConversationProvider, ProviderConfig } from './provider.types';

/**
 * Provider type enum for configuration-based switching.
 */
export enum ConversationProviderType {
  OPENAI = 'openai',
  VOICEFLOW = 'voiceflow',
}

/**
 * Factory function to create a conversation provider based on configuration.
 * 
 * Usage:
 * ```typescript
 * const provider = createConversationProvider('openai');
 * // or
 * const provider = createConversationProvider(
 *   process.env.CONVERSATION_PROVIDER as ConversationProviderType
 * );
 * ```
 * 
 * @param type - Provider type to create
 * @param config - Optional provider configuration
 * @returns Conversation provider instance
 */
export function createConversationProvider(
  type: ConversationProviderType,
  config?: ProviderConfig
): IConversationProvider {
  switch (type) {
    case ConversationProviderType.OPENAI:
      return new OpenAIProvider(config);
    
    case ConversationProviderType.VOICEFLOW:
      return new VoiceflowProvider(config);
    
    default:
      throw new Error(`Unknown conversation provider type: ${type}`);
  }
}
