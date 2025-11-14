import { api } from "encore.dev/api";
import db from "../db";
import type { 
  GetAppointmentDetailRequest, 
  GetAppointmentDetailResponse,
  AppointmentWithPatient,
  AppointmentSummary,
  AppointmentNote,
  AppointmentAction,
  PatientTimelineEvent
} from "./types";

export const getAppointmentDetail = api<GetAppointmentDetailRequest, GetAppointmentDetailResponse>(
  { expose: true, method: "POST", path: "/appointments/detail" },
  async (req) => {
    const { appointment_id, provider_id } = req;

    const appointmentQuery = await db.queryRow<AppointmentWithPatient & { patient_age: number }>`
      SELECT 
        a.id, a.provider_id, a.patient_id, a.appointment_date, 
        a.duration_minutes, a.appointment_type, a.status, a.reason,
        a.location, a.care_team_role, a.risk_level, a.pre_visit_summary_generated,
        a.created_at, a.updated_at,
        up.name as patient_name,
        EXTRACT(YEAR FROM AGE(NOW(), up.created_at)) as patient_age
      FROM appointments a
      JOIN user_profiles up ON a.patient_id = up.user_id
      WHERE a.id = ${appointment_id} AND a.provider_id = ${provider_id}
    `;

    if (!appointmentQuery) {
      throw new Error("Appointment not found");
    }

    const appointment: AppointmentWithPatient = {
      ...appointmentQuery,
      patient_age: appointmentQuery.patient_age || undefined
    };

    const patientProfileQuery = await db.queryRow<{
      name: string;
      wake_time: string | null;
      interaction_count: number;
      morning_routine_preferences: Record<string, any> | null;
      created_at: Date;
    }>`
      SELECT name, wake_time, interaction_count, morning_routine_preferences, created_at
      FROM user_profiles
      WHERE user_id = ${appointment.patient_id}
    `;

    const patient_profile = patientProfileQuery || {};

    const summaryQuery = await db.queryRow<AppointmentSummary>`
      SELECT id, appointment_id, summary_type, medication_adherence, symptom_patterns,
             mood_trends, diet_logs, routine_completion, clinical_risks, emma_alerts,
             key_insights, generated_at
      FROM appointment_summaries
      WHERE appointment_id = ${appointment_id}
      ORDER BY generated_at DESC
      LIMIT 1
    `;

    const notesQuery = await db.query<AppointmentNote>`
      SELECT id, appointment_id, provider_id, note_type, subjective, objective,
             assessment, plan, quick_note, template_used, created_at, updated_at
      FROM appointment_notes
      WHERE appointment_id = ${appointment_id}
      ORDER BY created_at DESC
    `;

    const notes: AppointmentNote[] = [];
    for await (const note of notesQuery) {
      notes.push(note);
    }

    const actionsQuery = await db.query<AppointmentAction>`
      SELECT id, appointment_id, action_type, description, assigned_to,
             status, due_date, completed_at, created_at
      FROM appointment_actions
      WHERE appointment_id = ${appointment_id}
      ORDER BY created_at DESC
    `;

    const actions: AppointmentAction[] = [];
    for await (const action of actionsQuery) {
      actions.push(action);
    }

    const timelineQuery = await db.query<PatientTimelineEvent>`
      SELECT id, patient_id, event_type, event_date, event_data, source, created_at
      FROM patient_timeline_events
      WHERE patient_id = ${appointment.patient_id}
      ORDER BY event_date DESC
      LIMIT 20
    `;

    const timeline_events: PatientTimelineEvent[] = [];
    for await (const event of timelineQuery) {
      timeline_events.push(event);
    }

    return {
      appointment,
      patient_profile,
      summary: summaryQuery || null,
      notes,
      actions,
      timeline_events
    };
  }
);
