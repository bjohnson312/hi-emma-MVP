import { api } from "encore.dev/api";
import db from "../db";
import type { AccessShareRequest, AccessShareResponse, DataCategory } from "./types";
import { generateExport } from "./generate_export";
import { generatePDF } from "./generate_pdf";

export const accessShare = api<AccessShareRequest, AccessShareResponse>(
  { expose: true, method: "POST", path: "/journal/access-share", auth: false },
  async (req) => {
    const { share_token } = req;

    const share = await db.queryRow<any>`
      SELECT 
        id,
        user_id,
        recipient_name,
        recipient_email,
        date_range_start,
        date_range_end,
        included_categories,
        include_conversations,
        format,
        expires_at,
        access_count,
        max_access_count,
        active
      FROM export_shares
      WHERE share_token = ${share_token}
    `;

    if (!share) {
      return {
        valid: false,
        format: "json"
      };
    }

    if (!share.active) {
      return {
        valid: false,
        format: share.format
      };
    }

    if (new Date() > new Date(share.expires_at)) {
      await db.exec`
        UPDATE export_shares
        SET active = false
        WHERE id = ${share.id}
      `;
      
      return {
        valid: false,
        format: share.format
      };
    }

    if (share.access_count >= share.max_access_count) {
      await db.exec`
        UPDATE export_shares
        SET active = false
        WHERE id = ${share.id}
      `;
      
      return {
        valid: false,
        format: share.format
      };
    }

    await db.exec`
      UPDATE export_shares
      SET 
        access_count = access_count + 1,
        last_accessed_at = NOW()
      WHERE id = ${share.id}
    `;

    const categories: DataCategory[] = share.included_categories;
    
    if (share.format === "pdf") {
      const pdfResult = await generatePDF({
        user_id: share.user_id,
        start_date: share.date_range_start,
        end_date: share.date_range_end,
        categories,
        include_conversations: share.include_conversations,
        recipient_name: share.recipient_name
      });

      return {
        valid: true,
        pdf_data: pdfResult.pdf_base64,
        format: "pdf",
        recipient_name: share.recipient_name,
        expires_at: share.expires_at,
        access_count: share.access_count + 1,
        max_access_count: share.max_access_count
      };
    } else {
      const exportData = await generateExport({
        user_id: share.user_id,
        start_date: share.date_range_start,
        end_date: share.date_range_end,
        categories,
        include_conversations: share.include_conversations
      });

      return {
        valid: true,
        data: exportData,
        format: "json",
        recipient_name: share.recipient_name,
        expires_at: share.expires_at,
        access_count: share.access_count + 1,
        max_access_count: share.max_access_count
      };
    }
  }
);
