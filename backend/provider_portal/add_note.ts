import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { verifyProviderToken } from "../provider_auth/utils";
import { checkProviderAccess } from "./access_control";
import { logAudit } from "./audit";
import type { ProviderNote } from "./types";

export interface AddNoteRequest {
  patientUserId: string;
  noteType: "observation" | "recommendation" | "order" | "followup" | "general";
  subject: string;
  content: string;
  priority?: "low" | "normal" | "high" | "urgent";
  isVisibleToPatient?: boolean;
  token: string;
}

export const addNote = api<AddNoteRequest, ProviderNote>(
  { method: "POST", path: "/provider/patients/:patientUserId/notes", expose: true },
  async (req): Promise<ProviderNote> => {
    const { patientUserId, noteType, subject, content, priority, isVisibleToPatient, token: authorization } = req;
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
      note_type: string;
      subject: string;
      content: string;
      priority: string;
      is_visible_to_patient: boolean;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO provider_notes (
        provider_id, patient_user_id, note_type, subject, 
        content, priority, is_visible_to_patient
      )
      VALUES (
        ${providerData.providerId}::uuid, ${patientUserId}, 
        ${noteType}, ${subject}, ${content},
        ${priority || "normal"}, 
        ${isVisibleToPatient !== false}
      )
      RETURNING *
    `;

    const provider = await db.queryRow<{ full_name: string }>`
      SELECT full_name FROM healthcare_providers WHERE id = ${providerData.providerId}::uuid
    `;

    if (!provider || !result) {
      throw APIError.notFound("Provider or note not found");
    }

    await logAudit({
      actorType: "provider",
      actorId: providerData.providerId,
      action: "add_note",
      resourceType: "provider_note",
      resourceId: result.id,
      patientUserId,
      details: { noteType, subject },
    });

    return {
      id: result.id,
      providerId: result.provider_id,
      providerName: provider.full_name || "Unknown",
      patientUserId: result.patient_user_id,
      noteType: result.note_type,
      subject: result.subject,
      content: result.content,
      priority: result.priority,
      isVisibleToPatient: result.is_visible_to_patient,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }
);
