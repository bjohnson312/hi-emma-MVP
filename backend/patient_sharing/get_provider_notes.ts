import { api } from "encore.dev/api";
import db from "../db";

export interface ProviderNoteForPatient {
  id: string;
  providerName: string;
  providerCredentials?: string;
  noteType: string;
  subject: string;
  content: string;
  priority: string;
  createdAt: Date;
}

export interface GetProviderNotesRequest {
  userId: string;
}

export interface ProviderNotesResponse {
  notes: ProviderNoteForPatient[];
}

export const getProviderNotes = api<GetProviderNotesRequest, ProviderNotesResponse>(
  { method: "GET", path: "/patient/provider-notes/:userId", expose: true },
  async (req): Promise<ProviderNotesResponse> => {
    const { userId } = req;

    const notes = await db.query<{
      id: string;
      provider_name: string;
      provider_credentials: string | null;
      note_type: string;
      subject: string;
      content: string;
      priority: string;
      created_at: Date;
    }>`
      SELECT 
        n.id,
        p.full_name as provider_name,
        p.credentials as provider_credentials,
        n.note_type,
        n.subject,
        n.content,
        n.priority,
        n.created_at
      FROM provider_notes n
      JOIN healthcare_providers p ON n.provider_id = p.id
      WHERE n.patient_user_id = ${userId}
        AND n.is_visible_to_patient = true
      ORDER BY n.created_at DESC
    `;

    const notesList: ProviderNoteForPatient[] = [];
    for await (const note of notes) {
      notesList.push({
        id: note.id,
        providerName: note.provider_name,
        providerCredentials: note.provider_credentials || undefined,
        noteType: note.note_type,
        subject: note.subject,
        content: note.content,
        priority: note.priority,
        createdAt: note.created_at,
      });
    }
    
    return {
      notes: notesList,
    };
  }
);
