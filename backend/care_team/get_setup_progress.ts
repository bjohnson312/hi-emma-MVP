import { api } from "encore.dev/api";
import type { CareTeamSetupProgress } from "./types";
import * as storage from "./storage";

export interface GetSetupProgressRequest {
  userId: string;
}

export const getSetupProgress = api<GetSetupProgressRequest, CareTeamSetupProgress>(
  { method: "GET", path: "/care-team/setup-progress/:userId", expose: true },
  async (req) => {
    return await storage.getProgress(req.userId);
  }
);
