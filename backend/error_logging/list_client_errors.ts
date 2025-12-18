import { api } from "encore.dev/api";
import db from "../db";
import type { ListClientErrorsRequest, ListClientErrorsResponse, ClientError } from "./types";

export const listClientErrors = api(
  { method: "POST", path: "/errors/list", expose: true },
  async (req: ListClientErrorsRequest): Promise<ListClientErrorsResponse> => {
    const limit = req.limit || 100;
    const offset = req.offset || 0;
    
    const errors: ClientError[] = [];
    
    for await (const row of db.query<ClientError>`
      SELECT * FROM client_errors
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) {
      errors.push(row);
    }
    
    const countResult = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM client_errors
    `;
    
    return {
      errors,
      total: countResult?.count || 0
    };
  }
);
