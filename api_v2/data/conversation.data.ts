import db from '../../backend/db';
import type { SessionType } from '../business/session';

export interface ConversationMessage {
  id: string;
  userId: string;
  sessionId?: string;
  conversationType: SessionType;
  userMessage?: string;
  emmaResponse: string;
  context?: Record<string, any>;
  createdAt: Date;
}

export interface ConversationMessageWithMetadata extends ConversationMessage {
  intent?: string;
  confidence?: number;
  emotionalTone?: string;
  suggestedActions?: Array<{ type: string; label: string; }>;
}

export class ConversationDataAccess {
  async storeMessage(params: {
    userId: string;
    sessionId?: string;
    conversationType: SessionType;
    userMessage?: string;
    emmaResponse: string;
    context?: Record<string, any>;
  }): Promise<string> {
    const context = params.context || {};
    if (params.sessionId) {
      context.sessionId = params.sessionId;
    }

    const result = await db.query<{ id: number }>(
      `INSERT INTO conversation_history 
         (user_id, conversation_type, user_message, emma_response, context)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        params.userId,
        params.conversationType,
        params.userMessage || null,
        params.emmaResponse,
        JSON.stringify(context),
      ]
    );

    return result[0].id.toString();
  }

  async getConversationHistory(
    userId: string,
    sessionId?: string,
    limit: number = 50
  ): Promise<ConversationMessage[]> {
    let query: string;
    let queryParams: any[];

    if (sessionId) {
      query = `SELECT id, user_id, conversation_type, user_message, 
                      emma_response, context, created_at
               FROM conversation_history
               WHERE user_id = $1 AND context->>'sessionId' = $2
               ORDER BY created_at DESC
               LIMIT $3`;
      queryParams = [userId, sessionId, limit];
    } else {
      query = `SELECT id, user_id, conversation_type, user_message,
                      emma_response, context, created_at
               FROM conversation_history
               WHERE user_id = $1
               ORDER BY created_at DESC
               LIMIT $2`;
      queryParams = [userId, limit];
    }

    const result = await db.query<{
      id: number;
      user_id: string;
      conversation_type: string;
      user_message?: string;
      emma_response: string;
      context: Record<string, any>;
      created_at: Date;
    }>(query, queryParams);

    return result.map(row => ({
      id: row.id.toString(),
      userId: row.user_id,
      sessionId: row.context?.sessionId,
      conversationType: row.conversation_type as SessionType,
      userMessage: row.user_message || undefined,
      emmaResponse: row.emma_response,
      context: row.context,
      createdAt: row.created_at,
    }));
  }

  async getRecentConversations(
    userId: string,
    conversationType?: SessionType,
    limit: number = 20
  ): Promise<ConversationMessage[]> {
    let query: string;
    let queryParams: any[];

    if (conversationType) {
      query = `SELECT id, user_id, conversation_type, user_message,
                      emma_response, context, created_at
               FROM conversation_history
               WHERE user_id = $1 AND conversation_type = $2
               ORDER BY created_at DESC
               LIMIT $3`;
      queryParams = [userId, conversationType, limit];
    } else {
      query = `SELECT id, user_id, conversation_type, user_message,
                      emma_response, context, created_at
               FROM conversation_history
               WHERE user_id = $1
               ORDER BY created_at DESC
               LIMIT $2`;
      queryParams = [userId, limit];
    }

    const result = await db.query<{
      id: number;
      user_id: string;
      conversation_type: string;
      user_message?: string;
      emma_response: string;
      context: Record<string, any>;
      created_at: Date;
    }>(query, queryParams);

    return result.map(row => ({
      id: row.id.toString(),
      userId: row.user_id,
      sessionId: row.context?.sessionId,
      conversationType: row.conversation_type as SessionType,
      userMessage: row.user_message || undefined,
      emmaResponse: row.emma_response,
      context: row.context,
      createdAt: row.created_at,
    }));
  }

  async getTodayConversations(
    userId: string,
    conversationType?: SessionType
  ): Promise<ConversationMessage[]> {
    let query: string;
    let queryParams: any[];

    if (conversationType) {
      query = `SELECT id, user_id, conversation_type, user_message,
                      emma_response, context, created_at
               FROM conversation_history
               WHERE user_id = $1 
                 AND conversation_type = $2
                 AND DATE(created_at) = CURRENT_DATE
               ORDER BY created_at ASC`;
      queryParams = [userId, conversationType];
    } else {
      query = `SELECT id, user_id, conversation_type, user_message,
                      emma_response, context, created_at
               FROM conversation_history
               WHERE user_id = $1
                 AND DATE(created_at) = CURRENT_DATE
               ORDER BY created_at ASC`;
      queryParams = [userId];
    }

    const result = await db.query<{
      id: number;
      user_id: string;
      conversation_type: string;
      user_message?: string;
      emma_response: string;
      context: Record<string, any>;
      created_at: Date;
    }>(query, queryParams);

    return result.map(row => ({
      id: row.id.toString(),
      userId: row.user_id,
      sessionId: row.context?.sessionId,
      conversationType: row.conversation_type as SessionType,
      userMessage: row.user_message || undefined,
      emmaResponse: row.emma_response,
      context: row.context,
      createdAt: row.created_at,
    }));
  }

  async getConversationCount(
    userId: string,
    conversationType?: SessionType,
    since?: Date
  ): Promise<number> {
    let query: string;
    let queryParams: any[];

    if (conversationType && since) {
      query = `SELECT COUNT(*) as count
               FROM conversation_history
               WHERE user_id = $1 
                 AND conversation_type = $2
                 AND created_at >= $3`;
      queryParams = [userId, conversationType, since];
    } else if (conversationType) {
      query = `SELECT COUNT(*) as count
               FROM conversation_history
               WHERE user_id = $1 AND conversation_type = $2`;
      queryParams = [userId, conversationType];
    } else if (since) {
      query = `SELECT COUNT(*) as count
               FROM conversation_history
               WHERE user_id = $1 AND created_at >= $2`;
      queryParams = [userId, since];
    } else {
      query = `SELECT COUNT(*) as count
               FROM conversation_history
               WHERE user_id = $1`;
      queryParams = [userId];
    }

    const result = await db.query<{ count: string }>(query, queryParams);
    return parseInt(result[0].count);
  }

  async storeDetectedInsight(params: {
    sessionId: string;
    userId: string;
    intentType: string;
    extractedData: Record<string, any>;
    confidence: number;
    suggestionText?: string;
  }): Promise<string> {
    const result = await db.query<{ id: string }>(
      `INSERT INTO conversation_detected_insights
         (session_id, user_id, intent_type, extracted_data, confidence, emma_suggestion_text)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        params.sessionId,
        params.userId,
        params.intentType,
        JSON.stringify(params.extractedData),
        params.confidence,
        params.suggestionText || null,
      ]
    );

    return result[0].id;
  }

  async getPendingInsights(userId: string): Promise<Array<{
    id: string;
    intentType: string;
    extractedData: Record<string, any>;
    confidence: number;
    suggestionText?: string;
    createdAt: Date;
  }>> {
    const result = await db.query<{
      id: string;
      intent_type: string;
      extracted_data: Record<string, any>;
      confidence: number;
      emma_suggestion_text?: string;
      created_at: Date;
    }>(
      `SELECT id, intent_type, extracted_data, confidence, 
              emma_suggestion_text, created_at
       FROM conversation_detected_insights
       WHERE user_id = $1 AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    return result.map(row => ({
      id: row.id,
      intentType: row.intent_type,
      extractedData: row.extracted_data,
      confidence: row.confidence,
      suggestionText: row.emma_suggestion_text,
      createdAt: row.created_at,
    }));
  }

  async updateInsightStatus(
    insightId: string,
    status: 'applied' | 'dismissed'
  ): Promise<void> {
    const column = status === 'applied' ? 'applied_at' : 'dismissed_at';
    await db.query(
      `UPDATE conversation_detected_insights
       SET status = $1, ${column} = NOW()
       WHERE id = $2`,
      [status, insightId]
    );
  }
}
