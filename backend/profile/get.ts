import { api } from "encore.dev/api";
import db from "../db";
import type { GetProfileRequest, UserProfile } from "./types";

interface GetProfileResponse {
  profile: UserProfile | null;
}

export const get = api<GetProfileRequest, GetProfileResponse>(
  { expose: true, method: "GET", path: "/profile/:user_id" },
  async (req) => {
    const { user_id } = req;

    const profile = await db.queryRow<UserProfile>`
      SELECT id, user_id, name, wake_time, morning_routine_preferences, created_at, updated_at
      FROM user_profiles
      WHERE user_id = ${user_id}
    `;

    return { profile: profile || null };
  }
);
