import { api } from "encore.dev/api";
import db from "../db";
import type { CreateProfileRequest, UserProfile } from "./types";

export const create = api<CreateProfileRequest, UserProfile>(
  { expose: true, method: "POST", path: "/profile" },
  async (req) => {
    const { user_id, name } = req;

    const existing = await db.queryRow<UserProfile>`
      SELECT id, user_id, name, created_at, updated_at
      FROM user_profiles
      WHERE user_id = ${user_id}
    `;

    if (existing) {
      return existing;
    }

    const result = await db.queryRow<UserProfile>`
      INSERT INTO user_profiles (user_id, name)
      VALUES (${user_id}, ${name})
      RETURNING id, user_id, name, created_at, updated_at
    `;

    return result!;
  }
);
