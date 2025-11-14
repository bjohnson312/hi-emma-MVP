import { api } from "encore.dev/api";
import db from "../db";
import type { GetAppointmentsRequest, GetAppointmentsResponse, AppointmentWithPatient } from "./types";

export const getAppointments = api<GetAppointmentsRequest, GetAppointmentsResponse>(
  { expose: true, method: "POST", path: "/appointments/list" },
  async (req) => {
    const { provider_id, start_date, end_date, view_type, status } = req;

    let startDate: Date;
    let endDate: Date;

    if (start_date && end_date) {
      startDate = start_date;
      endDate = end_date;
    } else if (view_type === 'week') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate = today;
      endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 7);
    } else if (view_type === 'month') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate = today;
      endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate = today;
      endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 1);
    }

    let appointmentsQuery;
    
    if (status) {
      appointmentsQuery = await db.query<AppointmentWithPatient & { patient_age: number }>`
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
          AND a.appointment_date >= ${startDate}
          AND a.appointment_date < ${endDate}
          AND a.status = ${status}
        ORDER BY a.appointment_date ASC
      `;
    } else {
      appointmentsQuery = await db.query<AppointmentWithPatient & { patient_age: number }>`
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
          AND a.appointment_date >= ${startDate}
          AND a.appointment_date < ${endDate}
        ORDER BY a.appointment_date ASC
      `;
    }

    const appointments: AppointmentWithPatient[] = [];
    let highRiskCount = 0;
    let alertsCount = 0;

    for await (const apt of appointmentsQuery) {
      appointments.push({
        ...apt,
        patient_age: apt.patient_age || undefined
      });

      if (apt.risk_level === 'high') {
        highRiskCount++;
      }

      if (apt.pre_visit_summary_generated) {
        const summaryQuery = await db.queryRow<{ alert_count: number }>`
          SELECT COALESCE(jsonb_array_length(emma_alerts::jsonb->'alerts'), 0) as alert_count
          FROM appointment_summaries
          WHERE appointment_id = ${apt.id}
          ORDER BY generated_at DESC
          LIMIT 1
        `;
        if (summaryQuery && summaryQuery.alert_count > 0) {
          alertsCount += summaryQuery.alert_count;
        }
      }
    }

    return {
      appointments,
      total_count: appointments.length,
      high_risk_count: highRiskCount,
      alerts_count: alertsCount
    };
  }
);
