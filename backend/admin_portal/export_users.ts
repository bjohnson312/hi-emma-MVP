import { api } from "encore.dev/api";
import db from "../db";
import type { ExportUsersResponse } from "./admin_types";

export const exportUsers = api(
  { method: "GET", path: "/admin/users/export", expose: true, auth: false },
  async (): Promise<ExportUsersResponse> => {
    const headers = "ID,Email,Created At,Last Login,Active,Login Count\n";
    const rows: string[] = [];

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
      const csvRow = [
        row.id,
        row.email || 'N/A',
        new Date(row.created_at as Date).toISOString(),
        row.last_login ? new Date(row.last_login as Date).toISOString() : 'Never',
        row.is_active ? 'Yes' : 'No',
        row.login_count
      ].join(',');
      
      rows.push(csvRow);
    }

    return {
      csv: headers + rows.join('\n'),
    };
  }
);
