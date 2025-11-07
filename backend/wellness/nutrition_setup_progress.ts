import { api } from "encore.dev/api";
import db from "../db";
import type { NutritionSetupProgress } from "./types";

interface GetNutritionSetupProgressRequest {
  user_id: string;
}

export const getNutritionSetupProgress = api<GetNutritionSetupProgressRequest, NutritionSetupProgress>(
  { expose: true, method: "GET", path: "/wellness/nutrition-setup/progress/:user_id" },
  async (req) => {
    const progress = await db.queryRow<{
      user_id: string;
      current_step: number;
      steps_completed: string[];
      is_completed: boolean;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT user_id, current_step, steps_completed, is_completed, created_at, updated_at
      FROM nutrition_setup_progress
      WHERE user_id = ${req.user_id}
    `;

    if (!progress) {
      await db.exec`
        INSERT INTO nutrition_setup_progress (user_id, current_step, steps_completed, is_completed)
        VALUES (${req.user_id}, 0, '{}', false)
      `;

      return {
        userId: req.user_id,
        currentStep: 0,
        stepsCompleted: [],
        isCompleted: false
      };
    }

    return {
      userId: progress.user_id,
      currentStep: progress.current_step,
      stepsCompleted: progress.steps_completed || [],
      isCompleted: progress.is_completed,
      createdAt: progress.created_at,
      updatedAt: progress.updated_at
    };
  }
);

interface UpdateNutritionSetupProgressRequest {
  user_id: string;
  current_step: number;
  steps_completed: string[];
  is_completed?: boolean;
}

export const updateNutritionSetupProgress = api<UpdateNutritionSetupProgressRequest, NutritionSetupProgress>(
  { expose: true, method: "PATCH", path: "/wellness/nutrition-setup/progress/:user_id" },
  async (req) => {
    await db.exec`
      INSERT INTO nutrition_setup_progress 
        (user_id, current_step, steps_completed, is_completed, updated_at)
      VALUES 
        (${req.user_id}, ${req.current_step}, ${req.steps_completed}, ${req.is_completed || false}, NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET current_step = EXCLUDED.current_step,
          steps_completed = EXCLUDED.steps_completed,
          is_completed = EXCLUDED.is_completed,
          updated_at = NOW()
    `;

    return {
      userId: req.user_id,
      currentStep: req.current_step,
      stepsCompleted: req.steps_completed,
      isCompleted: req.is_completed || false
    };
  }
);
