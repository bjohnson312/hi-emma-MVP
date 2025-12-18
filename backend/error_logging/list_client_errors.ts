import { api } from "encore.dev/api";
import db from "../db";
import type { ListClientErrorsRequest, ListClientErrorsResponse, ClientError } from "./types";

export const listClientErrors = api(
  { method: "POST", path: "/errors/list", expose: true },
  async (req: ListClientErrorsRequest): Promise<ListClientErrorsResponse> => {
    const limit = req.limit || 100;
    const offset = req.offset || 0;
    
    let query = db.sql`SELECT * FROM client_errors WHERE 1=1`;
    
    if (req.severity) {
      query = db.sql`${query} AND severity = ${req.severity}`;
    }
    
    if (req.error_type) {
      query = db.sql`${query} AND error_type = ${req.error_type}`;
    }
    
    if (req.component_name) {
      query = db.sql`${query} AND component_name = ${req.component_name}`;
    }
    
    if (req.resolved !== undefined) {
      query = db.sql`${query} AND resolved = ${req.resolved}`;
    }
    
    if (req.user_id) {
      query = db.sql`${query} AND user_id = ${req.user_id}`;
    }
    
    if (req.start_date) {
      query = db.sql`${query} AND created_at >= ${req.start_date}`;
    }
    
    if (req.end_date) {
      query = db.sql`${query} AND created_at <= ${req.end_date}`;
    }
    
    query = db.sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const errors = await db.query<ClientError>(query);
    
    let countQuery = db.sql`SELECT COUNT(*) as count FROM client_errors WHERE 1=1`;
    
    if (req.severity) {
      countQuery = db.sql`${countQuery} AND severity = ${req.severity}`;
    }
    
    if (req.error_type) {
      countQuery = db.sql`${countQuery} AND error_type = ${req.error_type}`;
    }
    
    if (req.component_name) {
      countQuery = db.sql`${countQuery} AND component_name = ${req.component_name}`;
    }
    
    if (req.resolved !== undefined) {
      countQuery = db.sql`${countQuery} AND resolved = ${req.resolved}`;
    }
    
    if (req.user_id) {
      countQuery = db.sql`${countQuery} AND user_id = ${req.user_id}`;
    }
    
    if (req.start_date) {
      countQuery = db.sql`${countQuery} AND created_at >= ${req.start_date}`;
    }
    
    if (req.end_date) {
      countQuery = db.sql`${countQuery} AND created_at <= ${req.end_date}`;
    }
    
    const countResult = await db.queryRow<{ count: number }>(countQuery);
    
    return {
      errors: errors || [],
      total: countResult?.count || 0
    };
  }
);
