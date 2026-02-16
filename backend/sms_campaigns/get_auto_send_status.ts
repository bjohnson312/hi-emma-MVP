import { api } from "encore.dev/api";
import db from "../db";

export const getAutoSendStatus = api(
  { expose: true, method: "GET", path: "/sms-campaigns/auto-send-status", auth: false },
  async (): Promise<{ enabled: boolean }> => {
    try {
      const result = await db.queryRow<{ value: string }>`
        SELECT value FROM admin_settings WHERE key = 'auto_send_sms_campaigns'
      `;
      
      return { enabled: result?.value === 'true' };
    } catch (error) {
      return { enabled: true };
    }
  }
);
