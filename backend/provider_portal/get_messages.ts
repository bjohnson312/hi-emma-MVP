import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { verifyProviderToken } from "../provider_auth/utils";
import { checkProviderAccess } from "./access_control";
import type { Message } from "./types";

export interface GetMessagesRequest {
  patientUserId: string;
  token: string;
}

export interface MessagesResponse {
  messages: Message[];
}

export const getMessages = api<GetMessagesRequest, MessagesResponse>(
  { method: "GET", path: "/provider/patients/:patientUserId/messages", expose: true },
  async (req): Promise<MessagesResponse> => {
    const { patientUserId, token: authorization } = req;
    if (!authorization) {
      throw APIError.unauthenticated("Missing authorization header");
    }

    const token = authorization.replace("Bearer ", "");
    const providerData = verifyProviderToken(token);

    await checkProviderAccess(providerData.providerId, patientUserId, "read");

    const messages = await db.query<{
      id: string;
      provider_id: string | null;
      provider_name: string | null;
      patient_user_id: string;
      sender_type: string;
      message: string;
      is_read: boolean;
      read_at: Date | null;
      created_at: Date;
    }>`
      SELECT 
        m.id, m.provider_id, m.patient_user_id, m.sender_type,
        m.message, m.is_read, m.read_at, m.created_at,
        p.full_name as provider_name
      FROM provider_patient_messages m
      LEFT JOIN healthcare_providers p ON m.provider_id = p.id
      WHERE m.patient_user_id = ${patientUserId}
        AND m.provider_id = ${providerData.providerId}::uuid
      ORDER BY m.created_at ASC
    `;

    const messagesList: Message[] = [];
    for await (const msg of messages) {
      messagesList.push({
        id: msg.id,
        providerId: msg.provider_id || undefined,
        providerName: msg.provider_name || undefined,
        patientUserId: msg.patient_user_id,
        senderType: msg.sender_type as "provider" | "patient",
        message: msg.message,
        isRead: msg.is_read,
        readAt: msg.read_at || undefined,
        createdAt: msg.created_at,
      });
    }
    
    return {
      messages: messagesList,
    };
  }
);
