import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { verifyProviderToken } from "../provider_auth/utils";

export interface PatientListItem {
  userId: string;
  fullName: string;
  email?: string;
  accessLevel: string;
  grantedAt: Date;
  expiresAt?: Date;
  lastActivity?: Date;
}

export interface PatientListResponse {
  patients: PatientListItem[];
}

export interface ListPatientsRequest {
  token: string;
}

export const listPatients = api<ListPatientsRequest, PatientListResponse>(
  { method: "GET", path: "/provider/patients", expose: true },
  async (req): Promise<PatientListResponse> => {
    const { token: authorization } = req;
    if (!authorization) {
      throw APIError.unauthenticated("Missing authorization header");
    }

    const token = authorization.replace("Bearer ", "");
    const providerData = verifyProviderToken(token);

    const patients = await db.query<{
      user_id: string;
      full_name: string;
      email: string | null;
      access_level: string;
      granted_at: Date;
      expires_at: Date | null;
      last_activity: Date | null;
    }>`
      SELECT 
        a.patient_user_id as user_id,
        p.full_name,
        u.email,
        a.access_level,
        a.granted_at,
        a.expires_at,
        (
          SELECT MAX(created_at) 
          FROM morning_routine_logs 
          WHERE user_id = a.patient_user_id
        ) as last_activity
      FROM provider_patient_access a
      LEFT JOIN user_profiles p ON a.patient_user_id = p.user_id
      LEFT JOIN users u ON a.patient_user_id = u.id
      WHERE a.provider_id = ${providerData.providerId}::uuid
        AND a.is_active = true
        AND (a.expires_at IS NULL OR a.expires_at > NOW())
      ORDER BY a.granted_at DESC
    `;

    const patientsList: PatientListItem[] = [];
    for await (const patient of patients) {
      patientsList.push({
        userId: patient.user_id,
        fullName: patient.full_name || "Unknown",
        email: patient.email || undefined,
        accessLevel: patient.access_level,
        grantedAt: patient.granted_at,
        expiresAt: patient.expires_at || undefined,
        lastActivity: patient.last_activity || undefined,
      });
    }
    
    return {
      patients: patientsList,
    };
  }
);
