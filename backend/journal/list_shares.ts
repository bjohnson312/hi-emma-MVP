import { api } from "encore.dev/api";
import db from "../db";
import type { ListSharesRequest, ListSharesResponse, ShareInfo, DataCategory } from "./types";

export const listShares = api<ListSharesRequest, ListSharesResponse>(
  { expose: true, method: "POST", path: "/journal/list-shares" },
  async (req) => {
    const { user_id } = req;

    const sharesQuery = await db.query<any>`
      SELECT 
        id,
        recipient_name,
        recipient_email,
        date_range_start,
        date_range_end,
        included_categories,
        format,
        created_at,
        expires_at,
        access_count,
        max_access_count,
        active
      FROM export_shares
      WHERE user_id = ${user_id}
      ORDER BY created_at DESC
    `;
    const shares = [];
    for await (const share of sharesQuery) {
      shares.push(share);
    }

    const shareInfos: ShareInfo[] = shares.map(share => ({
      id: share.id,
      recipient_name: share.recipient_name,
      recipient_email: share.recipient_email,
      date_range: {
        start: share.date_range_start,
        end: share.date_range_end
      },
      categories: share.included_categories as DataCategory[],
      format: share.format,
      created_at: share.created_at,
      expires_at: share.expires_at,
      access_count: share.access_count,
      max_access_count: share.max_access_count,
      active: share.active
    }));

    return {
      shares: shareInfos
    };
  }
);
