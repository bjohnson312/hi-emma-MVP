import { api } from "encore.dev/api";
import db from "../db";
import type { UserListResponse } from "./types";

export const listUsers = api(
  { method: "GET", path: "/admin/users", expose: true, auth: false },
  async (): Promise<UserListResponse> => {
    const users = [];
    
    for await (const row of db.query`
      SELECT 
        id::text,
        email,
        created_at,
        last_login,
        COALESCE(is_active, true) as is_active,
        COALESCE(login_count, 0) as login_count
      FROM users
      ORDER BY created_at DESC
    `) {
      users.push({
        id: row.id as string,
        email: (row.email as string) || 'N/A',
        created_at: row.created_at as Date,
        last_login: row.last_login as Date | undefined,
        is_active: row.is_active as boolean,
        login_count: row.login_count as number,
      });
    }

    return {
      users,
      total: users.length,
    };
  }
);
