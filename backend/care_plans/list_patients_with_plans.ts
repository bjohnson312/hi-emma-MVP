import { api } from "encore.dev/api";
import db from "../db";

export interface PatientWithPlan {
  patient_id: string;
  patient_name: string;
  patient_email?: string;
  patient_phone?: string;
  user_id?: string;
  care_plan_id: number;
  care_plan_name: string;
  care_plan_description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ListPatientsWithPlansRequest {
  token: string;
}

export interface ListPatientsWithPlansResponse {
  patients: PatientWithPlan[];
}

export const listPatientsWithPlans = api<ListPatientsWithPlansRequest, ListPatientsWithPlansResponse>(
  { expose: true, method: "POST", path: "/care_plans/patients" },
  async ({ token }) => {
    const providerResult = await db.queryRow<{ id: string }>`
      SELECT id FROM provider_credentials WHERE token = ${token}
    `;

    if (!providerResult) {
      throw new Error("Invalid provider token");
    }

    const providerId = providerResult.id;

    const result = await db.query<PatientWithPlan>`
      SELECT 
        p.id AS patient_id,
        p.full_name AS patient_name,
        p.email AS patient_email,
        p.phone AS patient_phone,
        p.user_id,
        cp.id AS care_plan_id,
        cp.name AS care_plan_name,
        cp.description AS care_plan_description,
        cp.created_at,
        cp.updated_at
      FROM patients p
      INNER JOIN care_plans cp ON cp.patient_id = p.id::text
      WHERE p.created_by_provider_id = ${providerId}
        AND p.is_active = true
        AND cp.is_active = true
      ORDER BY cp.updated_at DESC
    `;

    const patients: PatientWithPlan[] = [];
    for await (const row of result) {
      patients.push(row);
    }

    return { patients };
  }
);
