import { api } from "encore.dev/api";
import db from "../db";
import type { GetRoutinePreferenceRequest, MorningRoutinePreference } from "./routine_types";

interface GetRoutinePreferenceResponse {
  preference: MorningRoutinePreference | null;
}

export const getRoutinePreference = api<GetRoutinePreferenceRequest, GetRoutinePreferenceResponse>(
  { expose: true, method: "POST", path: "/morning_routine/preference/get" },
  async (req) => {
    const { user_id } = req;

    const preference = await db.queryRow<MorningRoutinePreference>`
      SELECT * FROM morning_routine_preferences
      WHERE user_id = ${user_id} AND is_active = true
    `;

    return { preference: preference || null };
  }
);
