import { api } from "encore.dev/api";
import db from "../db";

interface GetMorningSetupProgressRequest {
  user_id: string;
}

interface SetupStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  route?: string;
}

interface GetMorningSetupProgressResponse {
  completion_percentage: number;
  steps: SetupStep[];
  all_complete: boolean;
}

export const getMorningSetupProgress = api<GetMorningSetupProgressRequest, GetMorningSetupProgressResponse>(
  { expose: true, method: "POST", path: "/morning_routine/setup/progress" },
  async (req) => {
    const { user_id } = req;

    // Check if user has a morning routine preference
    const hasRoutine = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM morning_routine_preferences 
        WHERE user_id = ${user_id} AND is_active = true
      ) as exists
    `;

    // Check if user has completed at least one routine
    const hasCompletion = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM morning_routine_completions 
        WHERE user_id = ${user_id}
      ) as exists
    `;

    const steps: SetupStep[] = [
      {
        id: "select_routine",
        name: "Select a Morning Routine",
        description: "Choose a template or create your custom routine",
        completed: hasRoutine?.exists || false,
        route: "morning-routine"
      },
      {
        id: "complete_routine",
        name: "Complete Your First Routine",
        description: "Start your day by checking off your activities",
        completed: hasCompletion?.exists || false,
        route: "morning-routine"
      }
    ];

    const completedSteps = steps.filter(s => s.completed).length;
    const totalSteps = steps.length;
    const completion_percentage = Math.round((completedSteps / totalSteps) * 100);

    return {
      completion_percentage,
      steps,
      all_complete: completedSteps === totalSteps
    };
  }
);
