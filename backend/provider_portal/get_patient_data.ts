import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { verifyProviderToken } from "../provider_auth/utils";
import { checkProviderAccess } from "./access_control";
import { logAudit } from "./audit";
import type { PatientWellnessData } from "./types";

export interface GetPatientDataRequest {
  patientUserId: string;
  token: string;
}

export const getPatientData = api<GetPatientDataRequest, PatientWellnessData>(
  { method: "GET", path: "/provider/patients/:patientUserId/data", expose: true },
  async (req): Promise<PatientWellnessData> => {
    const { patientUserId, token: authorization } = req;
    if (!authorization) {
      throw APIError.unauthenticated("Missing authorization header");
    }

    const token = authorization.replace("Bearer ", "");
    const providerData = verifyProviderToken(token);

    await checkProviderAccess(providerData.providerId, patientUserId, "read");

    const patientProfile = await db.queryRow<{ full_name: string }>`
      SELECT full_name FROM user_profiles WHERE user_id = ${patientUserId}
    `;
    
    if (!patientProfile) {
      throw APIError.notFound("Patient profile not found");
    }

    const morningCheckInsQuery = await db.query<any>`
      SELECT * FROM morning_routine_logs 
      WHERE user_id = ${patientUserId}
      ORDER BY check_in_time DESC
      LIMIT 30
    `;
    
    const morningCheckIns = [];
    for await (const row of morningCheckInsQuery) {
      morningCheckIns.push(row);
    }

    const moodEntriesQuery = await db.query<any>`
      SELECT * FROM mood_tracking
      WHERE user_id = ${patientUserId}
      ORDER BY tracked_at DESC
      LIMIT 30
    `;
    
    const moodEntries = [];
    for await (const row of moodEntriesQuery) {
      moodEntries.push(row);
    }

    const wellnessJournalQuery = await db.query<any>`
      SELECT * FROM wellness_journal_entries
      WHERE user_id = ${patientUserId}
      ORDER BY entry_date DESC
      LIMIT 30
    `;
    
    const wellnessJournal = [];
    for await (const row of wellnessJournalQuery) {
      wellnessJournal.push(row);
    }

    const recentInsightsQuery = await db.query<any>`
      SELECT * FROM user_insights
      WHERE user_id = ${patientUserId}
      ORDER BY generated_at DESC
      LIMIT 10
    `;
    
    const recentInsights = [];
    for await (const row of recentInsightsQuery) {
      recentInsights.push(row);
    }

    await logAudit({
      actorType: "provider",
      actorId: providerData.providerId,
      action: "view_patient_data",
      resourceType: "patient_data",
      resourceId: patientUserId,
      patientUserId,
      details: { dataTypes: ["morning_check_ins", "mood", "wellness_journal", "insights"] },
    });

    return {
      patientId: patientUserId,
      patientName: patientProfile.full_name || "Unknown",
      morningCheckIns,
      moodEntries,
      wellnessJournal,
      recentInsights,
    };
  }
);
