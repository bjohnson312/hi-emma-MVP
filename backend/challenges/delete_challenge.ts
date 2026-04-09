import { api } from "encore.dev/api";
import db from "../db";
import type { DeleteChallengeRequest, DeleteChallengeResponse } from "./types";

export const deleteChallenge = api(
  { expose: true, method: "POST", path: "/challenges/delete", auth: false },
  async (req: DeleteChallengeRequest): Promise<DeleteChallengeResponse> => {
    try {
      await db.exec`DELETE FROM challenges WHERE id = ${req.id}`;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || "Unknown error" };
    }
  }
);
