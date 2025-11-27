import { api } from "encore.dev/api";
import db from "../db";
import type { ListMessagesRequest, ListMessagesResponse, Message } from "./messages_types";

export const listMessages = api(
  { expose: true, method: "POST", path: "/admin/messages/list", auth: false },
  async (req: ListMessagesRequest): Promise<ListMessagesResponse> => {
    const limit = req.limit || 20;
    const offset = req.offset || 0;
    
    let countQuery;
    let messagesQuery;
    
    if (req.channel && req.direction) {
      countQuery = await db.queryRow<{ count: number }>`
        SELECT COUNT(*) as count
        FROM messages
        WHERE channel = ${req.channel} AND direction = ${req.direction}
      `;
      
      messagesQuery = await db.query<Message>`
        SELECT 
          id, created_at, channel, direction, "to", "from", body,
          status, error, external_id, metadata, user_id, template_name
        FROM messages
        WHERE channel = ${req.channel} AND direction = ${req.direction}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (req.channel) {
      countQuery = await db.queryRow<{ count: number }>`
        SELECT COUNT(*) as count
        FROM messages
        WHERE channel = ${req.channel}
      `;
      
      messagesQuery = await db.query<Message>`
        SELECT 
          id, created_at, channel, direction, "to", "from", body,
          status, error, external_id, metadata, user_id, template_name
        FROM messages
        WHERE channel = ${req.channel}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (req.direction) {
      countQuery = await db.queryRow<{ count: number }>`
        SELECT COUNT(*) as count
        FROM messages
        WHERE direction = ${req.direction}
      `;
      
      messagesQuery = await db.query<Message>`
        SELECT 
          id, created_at, channel, direction, "to", "from", body,
          status, error, external_id, metadata, user_id, template_name
        FROM messages
        WHERE direction = ${req.direction}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      countQuery = await db.queryRow<{ count: number }>`
        SELECT COUNT(*) as count
        FROM messages
      `;
      
      messagesQuery = await db.query<Message>`
        SELECT 
          id, created_at, channel, direction, "to", "from", body,
          status, error, external_id, metadata, user_id, template_name
        FROM messages
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }
    
    const total = countQuery?.count || 0;
    
    const messages = [];
    for await (const msg of messagesQuery) {
      messages.push(msg);
    }
    
    return {
      messages,
      total,
      has_more: offset + messages.length < total
    };
  }
);
