import { api } from "encore.dev/api";
import db from "../db";
import type { UnsubscribeRequest } from "./types";

export const unsubscribe = api(
  { method: "POST", path: "/push/unsubscribe", expose: true },
  async (req: UnsubscribeRequest): Promise<{ success: boolean }> => {
    const { userId, endpoint } = req;

    await db.exec`
      DELETE FROM push_subscriptions
      WHERE user_id = ${userId}
        AND endpoint = ${endpoint}
    `;

    return { success: true };
  }
);
