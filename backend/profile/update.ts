import { api } from "encore.dev/api";
import db from "../db";
import type { UpdateProfileRequest, UserProfile } from "./types";

export const update = api<UpdateProfileRequest, UserProfile>(
  { expose: true, method: "PUT", path: "/profile/:user_id" },
  async (req) => {
    const { user_id, name } = req;

    const result = await db.queryRow<UserProfile>`
      UPDATE user_profiles
      SET 
        name = COALESCE(${name}, name),
        updated_at = NOW()
      WHERE user_id = ${user_id}
      RETURNING id, user_id, name, created_at, updated_at
    `;

    if (!result) {
      throw new Error("Profile not found");
    }

    return result;
  }
);
