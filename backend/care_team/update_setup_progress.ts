import { api } from "encore.dev/api";
import type { CareTeamSetupProgress } from "./types";
import * as storage from "./storage";

export interface UpdateProgressRequest {
  userId: string;
  currentStep: number;
  stepsCompleted: string[];
  isCompleted?: boolean;
}

export const updateSetupProgress = api<UpdateProgressRequest, CareTeamSetupProgress>(
  { method: "PATCH", path: "/care-team/setup-progress/:userId", expose: true },
  async (req) => {
    return await storage.updateProgress(
      req.userId,
      req.currentStep,
      req.stepsCompleted,
      req.isCompleted || false
    );
  }
);
