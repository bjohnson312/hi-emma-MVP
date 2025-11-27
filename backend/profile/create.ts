import { api } from "encore.dev/api";
import db from "../db";
import type { CreateProfileRequest, UserProfile } from "./types";
import { updateJourneyProgress } from "../journey/update_progress";

export const create = api<CreateProfileRequest, UserProfile>(
  { expose: true, method: "POST", path: "/profile" },
  async (req) => {
    const { user_id, name, name_pronunciation } = req;

    const existing = await db.queryRow<UserProfile>`
      SELECT id, user_id, name, name_pronunciation, created_at, updated_at
      FROM user_profiles
      WHERE user_id = ${user_id}
    `;

    if (existing) {
      return existing;
    }

    const trimmedPronunciation = name_pronunciation?.trim() || null;
    const finalPronunciation = trimmedPronunciation && trimmedPronunciation.length > 0 && trimmedPronunciation.length <= 100 ? trimmedPronunciation : null;

    const result = await db.queryRow<UserProfile>`
      INSERT INTO user_profiles (user_id, name, name_pronunciation)
      VALUES (${user_id}, ${name}, ${finalPronunciation})
      RETURNING id, user_id, name, name_pronunciation, created_at, updated_at
    `;

    await updateJourneyProgress(user_id, "user_profile_completed", true);

    return result!;
  }
);
