import { api } from "encore.dev/api";
import db from "../db";
import type { LogClientErrorRequest } from "./types";

export const logClientError = api(
  { method: "POST", path: "/errors/log", expose: true, auth: false },
  async (req: LogClientErrorRequest): Promise<{ success: boolean; error_id?: string }> => {
    try {
      const result = await db.queryRow<{ id: string }>`
        INSERT INTO client_errors (
          user_id, 
          error_type, 
          component_name, 
          error_message, 
          error_stack,
          api_endpoint, 
          http_status_code, 
          user_agent, 
          browser_info,
          session_id,
          severity
        ) VALUES (
          ${req.user_id || null},
          ${req.error_type},
          ${req.component_name},
          ${req.error_message},
          ${req.error_stack || null},
          ${req.api_endpoint || null},
          ${req.http_status_code || null},
          ${req.browser_info?.user_agent || null},
          ${JSON.stringify(req.browser_info || {})},
          ${req.session_id || null},
          ${req.severity || 'medium'}
        )
        RETURNING id
      `;
      
      if (req.severity === 'critical') {
        console.error('🚨 CRITICAL CLIENT ERROR:', {
          id: result?.id,
          component: req.component_name,
          message: req.error_message,
          user_id: req.user_id
        });
      }
      
      return { 
        success: true,
        error_id: result?.id
      };
    } catch (error) {
      console.error("Failed to log client error (meta error!):", error);
      return { success: false };
    }
  }
);
