import db from '../../backend/db';
import type { SessionType } from '../business/session';

export interface ConversationSession {
  id: string;
  userId: string;
  sessionType: SessionType;
  currentStep?: string;
  context: Record<string, any>;
  startedAt: Date;
  lastActivityAt: Date;
  completed: boolean;
  messageCount: number;
}

export interface SessionMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export class SessionDataAccess {
  async getActiveSession(userId: string, sessionType: SessionType): Promise<ConversationSession | null> {
    const result = await db.query<{
      id: number;
      user_id: string;
      session_type: string;
      current_step?: string;
      context: Record<string, any>;
      started_at: Date;
      last_activity_at: Date;
      completed: boolean;
    }>(
      `SELECT id, user_id, session_type, current_step, context,
              started_at, last_activity_at, completed
       FROM conversation_sessions
       WHERE user_id = $1 
         AND session_type = $2 
         AND completed = false
         AND last_activity_at > NOW() - INTERVAL '6 hours'
       ORDER BY last_activity_at DESC
       LIMIT 1`,
      [userId, sessionType]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    const messageCount = await this.getMessageCount(row.id.toString());

    return {
      id: row.id.toString(),
      userId: row.user_id,
      sessionType: row.session_type as SessionType,
      currentStep: row.current_step,
      context: row.context || {},
      startedAt: row.started_at,
      lastActivityAt: row.last_activity_at,
      completed: row.completed,
      messageCount,
    };
  }

  async getSessionById(sessionId: string): Promise<ConversationSession | null> {
    const result = await db.query<{
      id: number;
      user_id: string;
      session_type: string;
      current_step?: string;
      context: Record<string, any>;
      started_at: Date;
      last_activity_at: Date;
      completed: boolean;
    }>(
      `SELECT id, user_id, session_type, current_step, context,
              started_at, last_activity_at, completed
       FROM conversation_sessions
       WHERE id = $1`,
      [parseInt(sessionId)]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    const messageCount = await this.getMessageCount(sessionId);

    return {
      id: row.id.toString(),
      userId: row.user_id,
      sessionType: row.session_type as SessionType,
      currentStep: row.current_step,
      context: row.context || {},
      startedAt: row.started_at,
      lastActivityAt: row.last_activity_at,
      completed: row.completed,
      messageCount,
    };
  }

  async createSession(
    userId: string,
    sessionType: SessionType,
    context?: Record<string, any>
  ): Promise<ConversationSession> {
    const result = await db.query<{
      id: number;
      user_id: string;
      session_type: string;
      current_step?: string;
      context: Record<string, any>;
      started_at: Date;
      last_activity_at: Date;
      completed: boolean;
    }>(
      `INSERT INTO conversation_sessions (user_id, session_type, context)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, session_type, current_step, context,
                 started_at, last_activity_at, completed`,
      [userId, sessionType, JSON.stringify(context || {})]
    );

    const row = result[0];

    return {
      id: row.id.toString(),
      userId: row.user_id,
      sessionType: row.session_type as SessionType,
      currentStep: row.current_step,
      context: row.context || {},
      startedAt: row.started_at,
      lastActivityAt: row.last_activity_at,
      completed: row.completed,
      messageCount: 0,
    };
  }

  async updateSession(
    sessionId: string,
    updates: {
      currentStep?: string;
      context?: Record<string, any>;
      completed?: boolean;
    }
  ): Promise<void> {
    const setClauses: string[] = ['last_activity_at = NOW()'];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.currentStep !== undefined) {
      setClauses.push(`current_step = $${paramCount++}`);
      values.push(updates.currentStep);
    }
    if (updates.context !== undefined) {
      setClauses.push(`context = $${paramCount++}`);
      values.push(JSON.stringify(updates.context));
    }
    if (updates.completed !== undefined) {
      setClauses.push(`completed = $${paramCount++}`);
      values.push(updates.completed);
    }

    values.push(parseInt(sessionId));

    await db.query(
      `UPDATE conversation_sessions
       SET ${setClauses.join(', ')}
       WHERE id = $${paramCount}`,
      values
    );
  }

  async endSession(sessionId: string): Promise<void> {
    await db.query(
      `UPDATE conversation_sessions
       SET completed = true, last_activity_at = NOW()
       WHERE id = $1`,
      [parseInt(sessionId)]
    );
  }

  async getMessageCount(sessionId: string): Promise<number> {
    const result = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM conversation_history
       WHERE context->>'sessionId' = $1`,
      [sessionId]
    );

    return parseInt(result[0].count);
  }

  async getRecentSessions(
    userId: string,
    limit: number = 10
  ): Promise<ConversationSession[]> {
    const result = await db.query<{
      id: number;
      user_id: string;
      session_type: string;
      current_step?: string;
      context: Record<string, any>;
      started_at: Date;
      last_activity_at: Date;
      completed: boolean;
    }>(
      `SELECT id, user_id, session_type, current_step, context,
              started_at, last_activity_at, completed
       FROM conversation_sessions
       WHERE user_id = $1
       ORDER BY last_activity_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    const sessions: ConversationSession[] = [];
    for (const row of result) {
      const messageCount = await this.getMessageCount(row.id.toString());
      sessions.push({
        id: row.id.toString(),
        userId: row.user_id,
        sessionType: row.session_type as SessionType,
        currentStep: row.current_step,
        context: row.context || {},
        startedAt: row.started_at,
        lastActivityAt: row.last_activity_at,
        completed: row.completed,
        messageCount,
      });
    }

    return sessions;
  }

  async getTodaySessions(userId: string, sessionType?: SessionType): Promise<ConversationSession[]> {
    const query = sessionType
      ? `SELECT id, user_id, session_type, current_step, context,
                started_at, last_activity_at, completed
         FROM conversation_sessions
         WHERE user_id = $1 
           AND session_type = $2
           AND DATE(started_at) = CURRENT_DATE
         ORDER BY started_at DESC`
      : `SELECT id, user_id, session_type, current_step, context,
                started_at, last_activity_at, completed
         FROM conversation_sessions
         WHERE user_id = $1
           AND DATE(started_at) = CURRENT_DATE
         ORDER BY started_at DESC`;

    const params = sessionType ? [userId, sessionType] : [userId];

    const result = await db.query<{
      id: number;
      user_id: string;
      session_type: string;
      current_step?: string;
      context: Record<string, any>;
      started_at: Date;
      last_activity_at: Date;
      completed: boolean;
    }>(query, params);

    const sessions: ConversationSession[] = [];
    for (const row of result) {
      const messageCount = await this.getMessageCount(row.id.toString());
      sessions.push({
        id: row.id.toString(),
        userId: row.user_id,
        sessionType: row.session_type as SessionType,
        currentStep: row.current_step,
        context: row.context || {},
        startedAt: row.started_at,
        lastActivityAt: row.last_activity_at,
        completed: row.completed,
        messageCount,
      });
    }

    return sessions;
  }
}
