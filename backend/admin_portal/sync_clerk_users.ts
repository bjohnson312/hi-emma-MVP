import { api } from "encore.dev/api";
import db from "../db";
import type { SyncClerkUsersResponse } from "./types";

export const syncClerkUsers = api(
  { method: "POST", path: "/admin/sync-clerk-users", expose: true, auth: false },
  async (): Promise<SyncClerkUsersResponse> => {
    try {
      const userIds = new Set<string>();
      
      for await (const row of db.query`
        SELECT DISTINCT user_id FROM app_events
      `) {
        userIds.add(row.user_id as string);
      }
      
      let synced = 0;
      let errors = 0;
      
      for (const userId of userIds) {
        try {
          const existing = await db.queryRow`
            SELECT id FROM users WHERE id = ${userId}
          `;
          
          if (!existing) {
            let loginCount = 0;
            for await (const row of db.query`
              SELECT COUNT(*)::int as count
              FROM app_events
              WHERE user_id = ${userId} AND event_type = 'login'
            `) {
              loginCount = row.count as number;
            }
            
            let lastLogin = null;
            for await (const row of db.query`
              SELECT created_at
              FROM app_events
              WHERE user_id = ${userId} AND event_type = 'login'
              ORDER BY created_at DESC
              LIMIT 1
            `) {
              lastLogin = row.created_at;
            }
            
            let createdAt = new Date();
            for await (const row of db.query`
              SELECT created_at
              FROM app_events
              WHERE user_id = ${userId}
              ORDER BY created_at ASC
              LIMIT 1
            `) {
              createdAt = row.created_at as Date;
            }
            
            await db.exec`
              INSERT INTO users (id, email, name, password_hash, created_at, is_active, login_count, last_login)
              VALUES (
                ${userId},
                ${userId + '@clerk-user.local'},
                'Clerk User (Pending Sync)',
                'clerk-managed',
                ${createdAt},
                true,
                ${loginCount},
                ${lastLogin}
              )
            `;
            
            synced++;
          }
        } catch (err) {
          console.error(`Failed to sync user ${userId}:`, err);
          errors++;
        }
      }
      
      return {
        success: true,
        synced,
        errors,
        message: `Synced ${synced} users from event history. ${errors} errors encountered. Users will be updated with real data on next login.`
      };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        synced: 0,
        errors: 0,
        message: `Failed to sync users: ${error}`
      };
    }
  }
);
