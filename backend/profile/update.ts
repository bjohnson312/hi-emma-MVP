import { api } from "encore.dev/api";
import db from "../db";
import type { UpdateProfileRequest, UserProfile } from "./types";

export const update = api<UpdateProfileRequest, UserProfile>(
  { expose: true, method: "PUT", path: "/profile/:user_id" },
  async (req) => {
    const { user_id, name, name_pronunciation } = req;

    const trimmedPronunciation = name_pronunciation !== undefined 
      ? (name_pronunciation?.trim() || null)
      : undefined;
    
    const finalPronunciation = trimmedPronunciation !== undefined 
      ? (trimmedPronunciation && trimmedPronunciation.length > 0 && trimmedPronunciation.length <= 100 ? trimmedPronunciation : null)
      : undefined;

    const result = await db.queryRow<UserProfile>`
      UPDATE user_profiles
      SET 
        name = COALESCE(${name}, name),
        name_pronunciation = CASE 
          WHEN ${finalPronunciation !== undefined} THEN ${finalPronunciation}
          ELSE name_pronunciation 
        END,
        updated_at = NOW()
      WHERE user_id = ${user_id}
      RETURNING id, user_id, name, name_pronunciation, created_at, updated_at
    `;

    if (!result) {
      throw new Error("Profile not found");
    }

    return result;
  }
);
