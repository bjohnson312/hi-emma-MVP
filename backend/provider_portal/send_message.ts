import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { verifyProviderToken } from "../provider_auth/utils";
import { checkProviderAccess } from "./access_control";
import { logAudit } from "./audit";
import type { Message } from "./types";

export interface SendMessageRequest {
  patientUserId: string;
  message: string;
  token: string;
}

export const sendMessage = api<SendMessageRequest, Message>(
  { method: "POST", path: "/provider/patients/:patientUserId/messages", expose: true },
  async (req): Promise<Message> => {
    const { patientUserId, message, token: authorization } = req;
    if (!authorization) {
      throw APIError.unauthenticated("Missing authorization header");
    }

    const token = authorization.replace("Bearer ", "");
    const providerData = verifyProviderToken(token);

    await checkProviderAccess(providerData.providerId, patientUserId, "write");

    const result = await db.queryRow<{
      id: string;
      provider_id: string;
      patient_user_id: string;
      sender_type: string;
      message: string;
      is_read: boolean;
      read_at: Date | null;
      created_at: Date;
    }>`
      INSERT INTO provider_patient_messages (
        provider_id, patient_user_id, sender_type, message
      )
      VALUES (
        ${providerData.providerId}::uuid, ${patientUserId}, 'provider', ${message}
      )
      RETURNING *
    `;

    const provider = await db.queryRow<{ full_name: string }>`
      SELECT full_name FROM healthcare_providers WHERE id = ${providerData.providerId}::uuid
    `;

    if (!provider || !result) {
      throw APIError.notFound("Provider or message not found");
    }

    await logAudit({
      actorType: "provider",
      actorId: providerData.providerId,
      action: "send_message",
      resourceType: "message",
      resourceId: result.id,
      patientUserId,
      details: { messageLength: message.length },
    });

    return {
      id: result.id,
      providerId: result.provider_id,
      providerName: provider.full_name || "Unknown",
      patientUserId: result.patient_user_id,
      senderType: result.sender_type as "provider" | "patient",
      message: result.message,
      isRead: result.is_read,
      readAt: result.read_at || undefined,
      createdAt: result.created_at,
    };
  }
);
