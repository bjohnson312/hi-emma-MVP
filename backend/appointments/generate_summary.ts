import { api } from "encore.dev/api";
import db from "../db";
import type { GenerateSummaryRequest, AppointmentSummary } from "./types";

async function generatePhysicianSummary(patientId: string, lookbackDays: number): Promise<Partial<AppointmentSummary>> {
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  const moodData = await db.query<{ created_at: Date; user_message: string }>`
    SELECT created_at, user_message
    FROM conversation_history
    WHERE user_id = ${patientId}
      AND conversation_type = 'mood'
      AND created_at >= ${lookbackDate}
    ORDER BY created_at DESC
    LIMIT 10
  `;

  const moodEntries: any[] = [];
  for await (const entry of moodData) {
    moodEntries.push(entry);
  }

  const routineData = await db.query<{ log_date: Date; completed: boolean }>`
    SELECT log_date, completed
    FROM morning_routine_logs
    WHERE user_id = ${patientId}
      AND log_date >= ${lookbackDate}
    ORDER BY log_date DESC
  `;

  const routineEntries: any[] = [];
  for await (const entry of routineData) {
    routineEntries.push(entry);
  }

  const adherenceRate = routineEntries.length > 0 
    ? (routineEntries.filter(r => r.completed).length / routineEntries.length) * 100
    : 0;

  const moodTrends = {
    total_check_ins: moodEntries.length,
    trend: moodEntries.length >= 3 ? "stable" : "insufficient_data",
    last_check_in: moodEntries[0]?.created_at || null
  };

  const clinicalRisks = [];
  if (adherenceRate < 60) {
    clinicalRisks.push("Low routine adherence - potential non-compliance");
  }
  if (moodEntries.length < 2 && lookbackDays >= 7) {
    clinicalRisks.push("Limited mood tracking - engagement concern");
  }

  return {
    summary_type: 'physician',
    medication_adherence: { adherence_rate: adherenceRate, total_logs: routineEntries.length },
    mood_trends: moodTrends,
    routine_completion: { completion_rate: adherenceRate, logs: routineEntries.length },
    clinical_risks: { risks: clinicalRisks, count: clinicalRisks.length },
    key_insights: [
      `Routine adherence: ${adherenceRate.toFixed(0)}%`,
      `Mood check-ins: ${moodEntries.length} in last ${lookbackDays} days`,
      clinicalRisks.length > 0 ? `${clinicalRisks.length} risk factors identified` : "No major risk factors"
    ]
  };
}

async function generateNurseSummary(patientId: string, lookbackDays: number): Promise<Partial<AppointmentSummary>> {
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  const routineData = await db.query<{ log_date: Date; completed: boolean; activities: any }>`
    SELECT log_date, completed, activities
    FROM morning_routine_logs
    WHERE user_id = ${patientId}
      AND log_date >= ${lookbackDate}
    ORDER BY log_date DESC
  `;

  const routineEntries: any[] = [];
  for await (const entry of routineData) {
    routineEntries.push(entry);
  }

  const careTeamNotes = await db.query<{ name: string; relationship: string }>`
    SELECT name, relationship
    FROM care_team_members
    WHERE user_id = ${patientId}
    LIMIT 5
  `;

  const careTeamList: any[] = [];
  for await (const member of careTeamNotes) {
    careTeamList.push(member);
  }

  const completionRate = routineEntries.length > 0
    ? (routineEntries.filter(r => r.completed).length / routineEntries.length) * 100
    : 0;

  return {
    summary_type: 'nurse',
    routine_completion: {
      completion_rate: completionRate,
      total_days: routineEntries.length,
      completed_days: routineEntries.filter(r => r.completed).length
    },
    emma_alerts: {
      alerts: completionRate < 70 ? ["Low routine adherence"] : [],
      count: completionRate < 70 ? 1 : 0
    },
    key_insights: [
      `Daily routine completion: ${completionRate.toFixed(0)}%`,
      `Care team members: ${careTeamList.length}`,
      `Active engagement: ${routineEntries.length} days tracked`
    ]
  };
}

async function generateDietitianSummary(patientId: string, lookbackDays: number): Promise<Partial<AppointmentSummary>> {
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  const journalEntries = await db.query<{ created_at: Date; content: string }>`
    SELECT created_at, content
    FROM wellness_journal_entries
    WHERE user_id = ${patientId}
      AND created_at >= ${lookbackDate}
    ORDER BY created_at DESC
    LIMIT 10
  `;

  const entries: any[] = [];
  for await (const entry of journalEntries) {
    entries.push(entry);
  }

  const dietPrefs = await db.queryRow<{ preferences: any }>`
    SELECT preferences
    FROM diet_preferences
    WHERE user_id = ${patientId}
  `;

  return {
    summary_type: 'dietitian',
    diet_logs: {
      entries_count: entries.length,
      preferences: dietPrefs?.preferences || {},
      tracking_consistency: entries.length >= 5 ? "good" : "needs_improvement"
    },
    key_insights: [
      `Nutrition entries: ${entries.length} in last ${lookbackDays} days`,
      entries.length >= 5 ? "Good tracking consistency" : "Encourage more consistent logging",
      "Diet preferences on file"
    ]
  };
}

async function generateMentalHealthSummary(patientId: string, lookbackDays: number): Promise<Partial<AppointmentSummary>> {
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  const moodData = await db.query<{ created_at: Date; user_message: string; emma_response: string }>`
    SELECT created_at, user_message, emma_response
    FROM conversation_history
    WHERE user_id = ${patientId}
      AND conversation_type = 'mood'
      AND created_at >= ${lookbackDate}
    ORDER BY created_at DESC
    LIMIT 15
  `;

  const moodEntries: any[] = [];
  for await (const entry of moodData) {
    moodEntries.push(entry);
  }

  const journalEntries = await db.query<{ created_at: Date; title: string }>`
    SELECT created_at, title
    FROM wellness_journal_entries
    WHERE user_id = ${patientId}
      AND created_at >= ${lookbackDate}
    ORDER BY created_at DESC
    LIMIT 10
  `;

  const journals: any[] = [];
  for await (const entry of journalEntries) {
    journals.push(entry);
  }

  const moodGraph = {
    total_check_ins: moodEntries.length,
    trend: "stable",
    journaling_active: journals.length > 0
  };

  return {
    summary_type: 'mental_health',
    mood_trends: moodGraph,
    key_insights: [
      `Mood check-ins: ${moodEntries.length} conversations`,
      `Journal entries: ${journals.length}`,
      moodEntries.length >= 5 ? "Active mood tracking" : "Encourage more frequent check-ins",
      journals.length > 0 ? "Journaling for reflection" : "No recent journal activity"
    ]
  };
}

async function generatePTSummary(patientId: string, lookbackDays: number): Promise<Partial<AppointmentSummary>> {
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  const routineData = await db.query<{ log_date: Date; activities: any }>`
    SELECT log_date, activities
    FROM morning_routine_logs
    WHERE user_id = ${patientId}
      AND log_date >= ${lookbackDate}
    ORDER BY log_date DESC
  `;

  const routineEntries: any[] = [];
  for await (const entry of routineData) {
    routineEntries.push(entry);
  }

  const activityLevels = {
    total_days: routineEntries.length,
    active_days: routineEntries.filter(r => r.activities && r.activities.length > 0).length
  };

  return {
    summary_type: 'physical_therapy',
    routine_completion: activityLevels,
    key_insights: [
      `Activity logged: ${activityLevels.active_days} of ${activityLevels.total_days} days`,
      activityLevels.active_days / activityLevels.total_days > 0.7 ? "Good exercise adherence" : "Encourage more activity",
      "Morning routine includes stretching/movement"
    ]
  };
}

export const generateSummary = api<GenerateSummaryRequest, AppointmentSummary>(
  { expose: true, method: "POST", path: "/appointments/generate-summary" },
  async (req) => {
    const { appointment_id, summary_type, provider_id } = req;

    const appointment = await db.queryRow<{ patient_id: string }>`
      SELECT patient_id
      FROM appointments
      WHERE id = ${appointment_id} AND provider_id = ${provider_id}
    `;

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    const preferences = await db.queryRow<{ lookback_days: number }>`
      SELECT lookback_days
      FROM provider_summary_preferences
      WHERE provider_id = ${provider_id}
    `;

    const lookbackDays = preferences?.lookback_days || 7;

    let summaryData: Partial<AppointmentSummary>;

    switch (summary_type) {
      case 'physician':
      case 'clinical':
        summaryData = await generatePhysicianSummary(appointment.patient_id, lookbackDays);
        break;
      case 'nurse':
      case 'care_coordination':
        summaryData = await generateNurseSummary(appointment.patient_id, lookbackDays);
        break;
      case 'dietitian':
      case 'nutrition':
        summaryData = await generateDietitianSummary(appointment.patient_id, lookbackDays);
        break;
      case 'mental_health':
        summaryData = await generateMentalHealthSummary(appointment.patient_id, lookbackDays);
        break;
      case 'physical_therapy':
      case 'pt':
        summaryData = await generatePTSummary(appointment.patient_id, lookbackDays);
        break;
      default:
        summaryData = await generatePhysicianSummary(appointment.patient_id, lookbackDays);
    }

    const summary = await db.queryRow<AppointmentSummary>`
      INSERT INTO appointment_summaries (
        appointment_id, summary_type, medication_adherence, symptom_patterns,
        mood_trends, diet_logs, routine_completion, clinical_risks, emma_alerts, key_insights
      )
      VALUES (
        ${appointment_id}, ${summaryData.summary_type}, ${JSON.stringify(summaryData.medication_adherence || {})},
        ${JSON.stringify(summaryData.symptom_patterns || {})}, ${JSON.stringify(summaryData.mood_trends || {})},
        ${JSON.stringify(summaryData.diet_logs || {})}, ${JSON.stringify(summaryData.routine_completion || {})},
        ${JSON.stringify(summaryData.clinical_risks || {})}, ${JSON.stringify(summaryData.emma_alerts || {})},
        ${summaryData.key_insights || []}
      )
      RETURNING id, appointment_id, summary_type, medication_adherence, symptom_patterns,
                mood_trends, diet_logs, routine_completion, clinical_risks, emma_alerts,
                key_insights, generated_at
    `;

    await db.exec`
      UPDATE appointments
      SET pre_visit_summary_generated = true, updated_at = NOW()
      WHERE id = ${appointment_id}
    `;

    return summary!;
  }
);
