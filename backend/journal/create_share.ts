import { api } from "encore.dev/api";
import db from "../db";
import type { CreateShareRequest, CreateShareResponse } from "./types";
import { randomBytes } from "crypto";

export const createShare = api<CreateShareRequest, CreateShareResponse>(
  { expose: true, method: "POST", path: "/journal/create-share" },
  async (req) => {
    const { 
      user_id, 
      recipient_name, 
      recipient_email,
      start_date, 
      end_date, 
      categories, 
      include_conversations,
      format,
      expires_in_hours = 168,
      max_access_count = 10
    } = req;

    const shareToken = randomBytes(32).toString('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours);

    const result = await db.queryRow<{ id: number }>`
      INSERT INTO export_shares (
        user_id,
        share_token,
        recipient_name,
        recipient_email,
        date_range_start,
        date_range_end,
        included_categories,
        include_conversations,
        format,
        expires_at,
        max_access_count
      ) VALUES (
        ${user_id},
        ${shareToken},
        ${recipient_name || null},
        ${recipient_email || null},
        ${start_date},
        ${end_date},
        ${categories},
        ${include_conversations},
        ${format},
        ${expiresAt},
        ${max_access_count}
      )
      RETURNING id
    `;

    const shareUrl = `https://hi-emma-morning-routine-d44g7ks82vjgsfshe5i0.lp.dev/shared/${shareToken}`;

    return {
      share_id: result!.id,
      share_token: shareToken,
      share_url: shareUrl,
      expires_at: expiresAt,
      max_access_count
    };
  }
);
