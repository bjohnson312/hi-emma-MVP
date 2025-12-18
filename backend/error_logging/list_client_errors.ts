import { api } from "encore.dev/api";
import db from "../db";
import type { ListClientErrorsRequest, ListClientErrorsResponse, ClientError } from "./types";

export const listClientErrors = api(
  { method: "POST", path: "/errors/list", expose: true },
  async (req: ListClientErrorsRequest): Promise<ListClientErrorsResponse> => {
    const conditions = [];
    const params: any[] = [];
    
    if (req.severity) {
      conditions.push(`severity = $${params.length + 1}`);
      params.push(req.severity);
    }
    
    if (req.error_type) {
      conditions.push(`error_type = $${params.length + 1}`);
      params.push(req.error_type);
    }
    
    if (req.component_name) {
      conditions.push(`component_name = $${params.length + 1}`);
      params.push(req.component_name);
    }
    
    if (req.resolved !== undefined) {
      conditions.push(`resolved = $${params.length + 1}`);
      params.push(req.resolved);
    }
    
    if (req.user_id) {
      conditions.push(`user_id = $${params.length + 1}`);
      params.push(req.user_id);
    }
    
    if (req.start_date) {
      conditions.push(`created_at >= $${params.length + 1}`);
      params.push(req.start_date);
    }
    
    if (req.end_date) {
      conditions.push(`created_at <= $${params.length + 1}`);
      params.push(req.end_date);
    }
    
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    
    const limit = req.limit || 100;
    const offset = req.offset || 0;
    
    const errors = await db.query<ClientError>`
      SELECT * FROM client_errors
      ${db.sql.raw(whereClause)}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    
    const countResult = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM client_errors
      ${db.sql.raw(whereClause)}
    `;
    
    return {
      errors: errors || [],
      total: countResult?.count || 0
    };
  }
);
