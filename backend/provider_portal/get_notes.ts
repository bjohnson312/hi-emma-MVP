import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { verifyProviderToken } from "../provider_auth/utils";
import { checkProviderAccess } from "./access_control";
import type { ProviderNote } from "./types";

export interface GetNotesRequest {
  patientUserId: string;
  token: string;
}

export interface NotesResponse {
  notes: ProviderNote[];
}

export const getNotes = api<GetNotesRequest, NotesResponse>(
  { method: "GET", path: "/provider/patients/:patientUserId/notes", expose: true },
  async (req): Promise<NotesResponse> => {
    const { patientUserId, token: authorization } = req;
    if (!authorization) {
      throw APIError.unauthenticated("Missing authorization header");
    }

    const token = authorization.replace("Bearer ", "");
    const providerData = verifyProviderToken(token);

    await checkProviderAccess(providerData.providerId, patientUserId, "read");

    const notes = await db.query<{
      id: string;
      provider_id: string;
      provider_name: string;
      patient_user_id: string;
      note_type: string;
      subject: string;
      content: string;
      priority: string;
      is_visible_to_patient: boolean;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT 
        n.id, n.provider_id, n.patient_user_id, n.note_type,
        n.subject, n.content, n.priority, n.is_visible_to_patient,
        n.created_at, n.updated_at, p.full_name as provider_name
      FROM provider_notes n
      LEFT JOIN healthcare_providers p ON n.provider_id = p.id
      WHERE n.patient_user_id = ${patientUserId}
      ORDER BY n.created_at DESC
    `;

    const notesList: ProviderNote[] = [];
    for await (const note of notes) {
      notesList.push({
        id: note.id,
        providerId: note.provider_id,
        providerName: note.provider_name,
        patientUserId: note.patient_user_id,
        noteType: note.note_type,
        subject: note.subject,
        content: note.content,
        priority: note.priority,
        isVisibleToPatient: note.is_visible_to_patient,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      });
    }
    
    return {
      notes: notesList,
    };
  }
);
