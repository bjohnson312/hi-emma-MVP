import { api } from "encore.dev/api";
import db from "../db";
import type { DailySummaryRequest, DailySummaryResponse, AppointmentWithPatient, AppointmentAction } from "./types";

export const getDailySummary = api<DailySummaryRequest, DailySummaryResponse>(
  { expose: true, method: "POST", path: "/appointments/daily-summary" },
  async (req) => {
    const { provider_id, date } = req;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const appointmentsQuery = await db.query<AppointmentWithPatient & { patient_age: number }>`
      SELECT 
        a.id, a.provider_id, a.patient_id, a.appointment_date, 
        a.duration_minutes, a.appointment_type, a.status, a.reason,
        a.location, a.care_team_role, a.risk_level, a.pre_visit_summary_generated,
        a.created_at, a.updated_at,
        up.name as patient_name,
        EXTRACT(YEAR FROM AGE(NOW(), up.created_at)) as patient_age
      FROM appointments a
      JOIN user_profiles up ON a.patient_id = up.user_id
      WHERE a.provider_id = ${provider_id}
        AND a.appointment_date >= ${startOfDay}
        AND a.appointment_date < ${endOfDay}
      ORDER BY a.appointment_date ASC
    `;

    const appointments: AppointmentWithPatient[] = [];
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;
    const topAlerts: string[] = [];

    for await (const apt of appointmentsQuery) {
      appointments.push({
        ...apt,
        patient_age: apt.patient_age || undefined
      });

      if (apt.risk_level === 'high') {
        highRiskCount++;
        topAlerts.push(`${apt.patient_name}: High-risk patient - review before appointment`);
      } else if (apt.risk_level === 'medium') {
        mediumRiskCount++;
      } else {
        lowRiskCount++;
      }

      if (apt.pre_visit_summary_generated) {
        const summary = await db.queryRow<{ emma_alerts: any }>`
          SELECT emma_alerts
          FROM appointment_summaries
          WHERE appointment_id = ${apt.id}
          ORDER BY generated_at DESC
          LIMIT 1
        `;

        if (summary && summary.emma_alerts && summary.emma_alerts.alerts) {
          const alerts = summary.emma_alerts.alerts as string[];
          alerts.forEach(alert => {
            if (topAlerts.length < 5) {
              topAlerts.push(`${apt.patient_name}: ${alert}`);
            }
          });
        }
      }
    }

    const actionsQuery = await db.query<AppointmentAction>`
      SELECT a.id, a.appointment_id, a.action_type, a.description, a.assigned_to,
             a.status, a.due_date, a.completed_at, a.created_at
      FROM appointment_actions a
      JOIN appointments apt ON a.appointment_id = apt.id
      WHERE apt.provider_id = ${provider_id}
        AND a.status = 'pending'
        AND (a.due_date IS NULL OR a.due_date <= ${endOfDay})
      ORDER BY a.due_date ASC NULLS LAST
      LIMIT 10
    `;

    const essentialActions: AppointmentAction[] = [];
    for await (const action of actionsQuery) {
      essentialActions.push(action);
    }

    return {
      total_appointments: appointments.length,
      high_risk_count: highRiskCount,
      medium_risk_count: mediumRiskCount,
      low_risk_count: lowRiskCount,
      top_alerts: topAlerts.slice(0, 3),
      essential_actions: essentialActions,
      prep_queue: appointments
    };
  }
);
