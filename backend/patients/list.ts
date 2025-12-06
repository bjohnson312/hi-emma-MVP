import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { verifyProviderToken } from "../provider_auth/utils";
import type { ListPatientsRequest, ListPatientsResponse, PatientListItem } from "./types";

export const listPatients = api<ListPatientsRequest, ListPatientsResponse>(
  { method: "GET", path: "/patients/list", expose: true },
  async (req): Promise<ListPatientsResponse> => {
    const { token, include_inactive = false, search } = req;

    if (!token) {
      throw APIError.unauthenticated("Missing authorization token");
    }

    const providerToken = token.replace("Bearer ", "");
    const providerData = verifyProviderToken(providerToken);

    let results;

    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      
      if (include_inactive) {
        results = await db.query<{
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          medical_record_number: string | null;
          user_id: string | null;
          created_at: Date;
          last_activity: Date | null;
        }>`
          SELECT 
            p.id,
            p.full_name,
            p.email,
            p.phone,
            p.medical_record_number,
            p.user_id,
            p.created_at,
            (
              SELECT MAX(created_at) 
              FROM morning_routine_logs 
              WHERE user_id = p.user_id
            ) as last_activity
          FROM patients p
          WHERE p.created_by_provider_id = ${providerData.providerId}::uuid
            AND (
              LOWER(p.full_name) LIKE ${searchTerm}
              OR LOWER(p.email) LIKE ${searchTerm}
              OR LOWER(p.medical_record_number) LIKE ${searchTerm}
              OR LOWER(p.phone) LIKE ${searchTerm}
            )
          ORDER BY p.created_at DESC
        `;
      } else {
        results = await db.query<{
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          medical_record_number: string | null;
          user_id: string | null;
          created_at: Date;
          last_activity: Date | null;
        }>`
          SELECT 
            p.id,
            p.full_name,
            p.email,
            p.phone,
            p.medical_record_number,
            p.user_id,
            p.created_at,
            (
              SELECT MAX(created_at) 
              FROM morning_routine_logs 
              WHERE user_id = p.user_id
            ) as last_activity
          FROM patients p
          WHERE p.created_by_provider_id = ${providerData.providerId}::uuid
            AND p.is_active = true
            AND (
              LOWER(p.full_name) LIKE ${searchTerm}
              OR LOWER(p.email) LIKE ${searchTerm}
              OR LOWER(p.medical_record_number) LIKE ${searchTerm}
              OR LOWER(p.phone) LIKE ${searchTerm}
            )
          ORDER BY p.created_at DESC
        `;
      }
    } else {
      if (include_inactive) {
        results = await db.query<{
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          medical_record_number: string | null;
          user_id: string | null;
          created_at: Date;
          last_activity: Date | null;
        }>`
          SELECT 
            p.id,
            p.full_name,
            p.email,
            p.phone,
            p.medical_record_number,
            p.user_id,
            p.created_at,
            (
              SELECT MAX(created_at) 
              FROM morning_routine_logs 
              WHERE user_id = p.user_id
            ) as last_activity
          FROM patients p
          WHERE p.created_by_provider_id = ${providerData.providerId}::uuid
          ORDER BY p.created_at DESC
        `;
      } else {
        results = await db.query<{
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          medical_record_number: string | null;
          user_id: string | null;
          created_at: Date;
          last_activity: Date | null;
        }>`
          SELECT 
            p.id,
            p.full_name,
            p.email,
            p.phone,
            p.medical_record_number,
            p.user_id,
            p.created_at,
            (
              SELECT MAX(created_at) 
              FROM morning_routine_logs 
              WHERE user_id = p.user_id
            ) as last_activity
          FROM patients p
          WHERE p.created_by_provider_id = ${providerData.providerId}::uuid
            AND p.is_active = true
          ORDER BY p.created_at DESC
        `;
      }
    }

    const patients: PatientListItem[] = [];
    for await (const row of results) {
      patients.push({
        id: row.id,
        full_name: row.full_name,
        email: row.email || undefined,
        phone: row.phone || undefined,
        medical_record_number: row.medical_record_number || undefined,
        user_id: row.user_id || undefined,
        has_app_access: !!row.user_id,
        last_activity: row.last_activity || undefined,
        created_at: row.created_at,
      });
    }

    return { patients };
  }
);
