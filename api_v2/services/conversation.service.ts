import type {
  SendMessageRequest,
  SendMessageResponse,
  ConversationSession,
  Message,
  EndSessionRequest,
  EndSessionResponse,
  ConversationMemory,
} from '../types';

export class ConversationService {
  async sendMessage(userId: string, req: SendMessageRequest): Promise<SendMessageResponse> {
    throw new Error('sendMessage() not implemented');
  }

  async getSessions(userId: string): Promise<ConversationSession[]> {
    throw new Error('getSessions() not implemented');
  }

  async getSessionMessages(userId: string, sessionId: string): Promise<Message[]> {
    throw new Error('getSessionMessages() not implemented');
  }

  async endSession(userId: string, sessionId: string, req: EndSessionRequest): Promise<EndSessionResponse> {
    throw new Error('endSession() not implemented');
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    throw new Error('deleteSession() not implemented');
  }

  async getMemory(userId: string): Promise<ConversationMemory> {
    throw new Error('getMemory() not implemented');
  }

  async clearMemory(userId: string): Promise<void> {
    throw new Error('clearMemory() not implemented');
  }
}

export const conversationService = new ConversationService();
