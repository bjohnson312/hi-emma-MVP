import { api } from "encore.dev/api";
import { devLogBuffer } from "../../api_v2/utils/devLogs";

/**
 * ⚠️ WARNING: DEBUG ENDPOINT - REMOVE BEFORE PRODUCTION DEPLOYMENT ⚠️
 * 
 * This endpoint exposes internal application logs and state.
 * It is intentionally left without authentication for debugging purposes.
 * 
 * TODO: Before production:
 * 1. Delete this entire file, OR
 * 2. Add environment check to disable in production, OR
 * 3. Add strong authentication and restrict to admin users only
 * 
 * Security Impact: HIGH - Exposes sensitive application internals
 */
export const devLogs = api(
  { method: "GET", path: "/api/v2/dev/logs", expose: true, auth: false },
  async (): Promise<{ logs: string[] }> => {
    // TODO: Add production check
    // if (process.env.NODE_ENV === 'production') {
    //   throw APIError.unavailable("Debug endpoint disabled in production");
    // }
    return { logs: devLogBuffer };
  }
);
