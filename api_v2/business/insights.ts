import type { Suggestion, ConversationSession, SuggestionType } from '../types';

export function determineSuggestionTypes(
  conversation: ConversationSession
): SuggestionType[] {
  throw new Error('determineSuggestionTypes() not implemented - Suggestion generation logic');
}

export function prioritizeSuggestions(
  suggestions: Suggestion[]
): Suggestion[] {
  throw new Error('prioritizeSuggestions() not implemented');
}

export function extractIntents(
  conversationText: string
): { intent: string; confidence: number }[] {
  throw new Error('extractIntents() not implemented - Intent detection');
}
