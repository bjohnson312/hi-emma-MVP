import { api } from "encore.dev/api";
import db from "../db";
import type { RevokeShareRequest } from "./types";

export const revokeShare = api<RevokeShareRequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/journal/revoke-share" },
  async (req) => {
    const { user_id, share_id } = req;

    await db.exec`
      UPDATE export_shares
      SET active = false
      WHERE id = ${share_id} AND user_id = ${user_id}
    `;

    return { success: true };
  }
);
