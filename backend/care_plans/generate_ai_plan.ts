import { api } from "encore.dev/api";
import type { GenerateAIPlanRequest, GenerateAIPlanResponse, CreateCarePlanItemRequest } from "./types";
import { CARE_PLAN_PRESETS } from "./presets";

const DISCLAIMER = "This care plan is general wellness support and not medical advice. Always follow your doctor's instructions and talk to your care team before making changes.";

export const generateAIPlan = api<GenerateAIPlanRequest, GenerateAIPlanResponse>(
  { expose: true, method: "POST", path: "/care-plans/generate" },
  async (req) => {
    const { user_id, condition, user_context } = req;

    const preset = CARE_PLAN_PRESETS[condition];
    
    if (preset) {
      return {
        plan_name: preset.name,
        description: preset.description,
        items: preset.items,
        disclaimer: DISCLAIMER
      };
    }

    const customItems: Omit<CreateCarePlanItemRequest, 'care_plan_id'>[] = [
      {
        type: "other",
        label: `Follow ${condition} care guidelines`,
        details: {
          instructions: user_context || "Consult with your healthcare provider for specific instructions"
        },
        frequency: "daily",
        reminder_enabled: true,
        sort_order: 0
      }
    ];

    return {
      plan_name: `${condition} Care Plan`,
      description: user_context || `Personalized care plan for ${condition}. Customize as needed.`,
      items: customItems,
      disclaimer: DISCLAIMER
    };
  }
);
