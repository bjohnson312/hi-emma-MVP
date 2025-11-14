import { api } from "encore.dev/api";
import db from "../db";
import type { CreateNoteRequest, AppointmentNote } from "./types";

export const createNote = api<CreateNoteRequest, AppointmentNote>(
  { expose: true, method: "POST", path: "/appointments/create-note" },
  async (req) => {
    const { appointment_id, provider_id, note_type, subjective, objective, assessment, plan, quick_note } = req;

    const appointment = await db.queryRow<{ id: number }>`
      SELECT id
      FROM appointments
      WHERE id = ${appointment_id} AND provider_id = ${provider_id}
    `;

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    const template_used = note_type === 'soap' ? 'SOAP' : note_type === 'quick' ? 'Quick Note' : note_type;

    const note = await db.queryRow<AppointmentNote>`
      INSERT INTO appointment_notes (
        appointment_id, provider_id, note_type, subjective, objective,
        assessment, plan, quick_note, template_used
      )
      VALUES (
        ${appointment_id}, ${provider_id}, ${note_type}, ${subjective}, ${objective},
        ${assessment}, ${plan}, ${quick_note}, ${template_used}
      )
      RETURNING id, appointment_id, provider_id, note_type, subjective, objective,
                assessment, plan, quick_note, template_used, created_at, updated_at
    `;

    return note!;
  }
);
