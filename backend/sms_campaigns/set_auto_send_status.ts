import { api } from "encore.dev/api";
import db from "../db";

export interface SetAutoSendStatusRequest {
  enabled: boolean;
}

export const setAutoSendStatus = api(
  { expose: true, method: "POST", path: "/sms-campaigns/auto-send-status", auth: false },
  async (req: SetAutoSendStatusRequest): Promise<{ success: boolean }> => {
    await db.exec`
      UPDATE admin_settings 
      SET value = ${req.enabled ? 'true' : 'false'}, updated_at = NOW() 
      WHERE key = 'auto_send_sms_campaigns'
    `;
    
    return { success: true };
  }
);
