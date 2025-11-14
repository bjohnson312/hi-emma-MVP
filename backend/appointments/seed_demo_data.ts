import { api } from "encore.dev/api";
import db from "../db";

export const seedDemoData = api(
  { expose: true, method: "POST", path: "/appointments/seed-demo-data" },
  async () => {
    const providerId = "demo-provider";

    const now = new Date();
    const today = new Date(now);
    today.setHours(9, 0, 0, 0);

    const appointments = [
      {
        patient_id: "demo-patient-1",
        date: new Date(today.getTime() + 0 * 60 * 60 * 1000),
        duration: 30,
        type: "Follow-up",
        reason: "Routine wellness check",
        role: "physician",
        risk: "low"
      },
      {
        patient_id: "demo-patient-2",
        date: new Date(today.getTime() + 2 * 60 * 60 * 1000),
        duration: 45,
        type: "Initial Consultation",
        reason: "Sleep issues and routine setup",
        role: "physician",
        risk: "medium"
      },
      {
        patient_id: "demo-patient-3",
        date: new Date(today.getTime() + 4 * 60 * 60 * 1000),
        duration: 30,
        type: "Nutrition Coaching",
        reason: "Meal planning and dietary goals",
        role: "dietitian",
        risk: "low"
      },
      {
        patient_id: "demo-patient-1",
        date: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        duration: 30,
        type: "Mental Health Check",
        reason: "Mood tracking review",
        role: "mental_health",
        risk: "low"
      },
      {
        patient_id: "demo-patient-2",
        date: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        duration: 30,
        type: "Follow-up",
        reason: "Review progress",
        role: "nurse",
        risk: "medium"
      },
      {
        patient_id: "demo-patient-3",
        date: new Date(today.getTime() + 48 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
        duration: 60,
        type: "Physical Therapy",
        reason: "Exercise adherence and mobility",
        role: "physical_therapy",
        risk: "low"
      },
      {
        patient_id: "demo-patient-1",
        date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        duration: 30,
        type: "Weekly Check-in",
        reason: "Routine wellness",
        role: "physician",
        risk: "low"
      },
      {
        patient_id: "demo-patient-2",
        date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        duration: 45,
        type: "Care Coordination",
        reason: "Review care plan",
        role: "nurse",
        risk: "high"
      }
    ];

    const createdAppointments: number[] = [];

    for (const apt of appointments) {
      const result = await db.queryRow<{ id: number }>`
        INSERT INTO appointments (
          provider_id, patient_id, appointment_date, duration_minutes,
          appointment_type, reason, care_team_role, risk_level, status
        )
        VALUES (
          ${providerId}, ${apt.patient_id}, ${apt.date}, ${apt.duration},
          ${apt.type}, ${apt.reason}, ${apt.role}, ${apt.risk}, 'scheduled'
        )
        RETURNING id
      `;

      if (result) {
        createdAppointments.push(result.id);

        await db.exec`
          INSERT INTO patient_timeline_events (
            patient_id, event_type, event_date, event_data, source
          )
          VALUES (
            ${apt.patient_id}, 'appointment_scheduled', ${apt.date},
            ${JSON.stringify({ type: apt.type, reason: apt.reason })},
            'appointments'
          )
        `;
      }
    }

    const firstTwoApts = createdAppointments.slice(0, 2);
    for (const aptId of firstTwoApts) {
      await db.exec`
        INSERT INTO appointment_actions (
          appointment_id, action_type, description, status, due_date
        )
        VALUES (
          ${aptId}, 'follow_up', 'Send post-visit summary to patient', 'pending',
          ${new Date(today.getTime() + 24 * 60 * 60 * 1000)}
        )
      `;

      await db.exec`
        INSERT INTO appointment_actions (
          appointment_id, action_type, description, assigned_to, status
        )
        VALUES (
          ${aptId}, 'care_team', 'Update care team on patient progress', 'care_coordinator', 'pending'
        )
      `;
    }

    await db.exec`
      INSERT INTO provider_summary_preferences (
        provider_id, default_summary_type, data_fields, lookback_days, alert_thresholds
      )
      VALUES (
        ${providerId}, 'physician', 
        ${JSON.stringify(['medication_adherence', 'mood_trends', 'routine_completion', 'clinical_risks'])},
        7,
        ${JSON.stringify({ adherence_threshold: 60, mood_decline_threshold: 2 })}
      )
      ON CONFLICT (provider_id) DO UPDATE SET
        updated_at = NOW()
    `;

    return {
      success: true,
      appointments_created: createdAppointments.length,
      appointment_ids: createdAppointments
    };
  }
);
