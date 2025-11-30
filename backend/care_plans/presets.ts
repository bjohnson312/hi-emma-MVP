import { api } from "encore.dev/api";
import type { CarePlanPreset } from "./types";

export const CARE_PLAN_PRESETS: Record<string, CarePlanPreset> = {
  hypertension: {
    key: "hypertension",
    name: "Blood Pressure Management",
    description: "Daily care plan for managing high blood pressure with medication tracking, monitoring, and healthy habits.",
    icon: "💊",
    items: [
      {
        type: "medication",
        label: "Blood pressure medication",
        details: {
          dosage: "As prescribed",
          instructions: "Take with water in the morning"
        },
        frequency: "once_daily",
        times_of_day: ["08:00"],
        reminder_enabled: true,
        sort_order: 0
      },
      {
        type: "measurement",
        label: "Check blood pressure",
        details: {
          unit: "mmHg",
          target_value: "< 130/80",
          instructions: "Measure after 5 minutes of rest"
        },
        frequency: "once_daily",
        times_of_day: ["09:00"],
        reminder_enabled: true,
        sort_order: 1
      },
      {
        type: "activity",
        label: "15-minute walk",
        details: {
          instructions: "Light to moderate pace, outdoors if possible"
        },
        frequency: "daily",
        times_of_day: ["17:00"],
        reminder_enabled: true,
        sort_order: 2
      },
      {
        type: "other",
        label: "Track sodium intake",
        details: {
          target_value: "< 2,300 mg/day",
          instructions: "Aim for low-sodium meals"
        },
        frequency: "daily",
        reminder_enabled: false,
        sort_order: 3
      }
    ]
  },
  diabetes_type_2: {
    key: "diabetes_type_2",
    name: "Diabetes Management (Type 2)",
    description: "Comprehensive plan for managing type 2 diabetes with medication, monitoring, and lifestyle habits.",
    icon: "🩸",
    items: [
      {
        type: "medication",
        label: "Diabetes medication",
        details: {
          dosage: "As prescribed",
          instructions: "Take with food"
        },
        frequency: "once_daily",
        times_of_day: ["08:00"],
        reminder_enabled: true,
        sort_order: 0
      },
      {
        type: "measurement",
        label: "Check blood sugar",
        details: {
          unit: "mg/dL",
          target_value: "80-130 (fasting)",
          instructions: "Before breakfast"
        },
        frequency: "daily",
        times_of_day: ["07:30"],
        reminder_enabled: true,
        sort_order: 1
      },
      {
        type: "activity",
        label: "30-minute exercise",
        details: {
          instructions: "Walking, cycling, or preferred activity"
        },
        frequency: "5x_week",
        days_of_week: [1, 2, 3, 4, 5],
        times_of_day: ["17:00"],
        reminder_enabled: true,
        sort_order: 2
      },
      {
        type: "other",
        label: "Healthy meal planning",
        details: {
          instructions: "Focus on balanced, portion-controlled meals"
        },
        frequency: "daily",
        reminder_enabled: false,
        sort_order: 3
      }
    ]
  },
  post_surgery: {
    key: "post_surgery",
    name: "Post-Surgery Recovery",
    description: "Recovery plan with pain management, wound care, and gentle movement exercises.",
    icon: "🏥",
    items: [
      {
        type: "medication",
        label: "Pain medication",
        details: {
          dosage: "As prescribed",
          instructions: "Take with food if needed"
        },
        frequency: "as_needed",
        reminder_enabled: false,
        sort_order: 0
      },
      {
        type: "activity",
        label: "Short walk (5-10 min)",
        details: {
          instructions: "Start slow, increase gradually"
        },
        frequency: "3x_daily",
        times_of_day: ["09:00", "14:00", "19:00"],
        reminder_enabled: true,
        sort_order: 1
      },
      {
        type: "other",
        label: "Wound care check",
        details: {
          instructions: "Check for redness, swelling, or drainage"
        },
        frequency: "daily",
        times_of_day: ["20:00"],
        reminder_enabled: true,
        sort_order: 2
      },
      {
        type: "activity",
        label: "Ice application",
        details: {
          instructions: "Apply ice for 15-20 minutes"
        },
        frequency: "3x_daily",
        times_of_day: ["10:00", "15:00", "20:00"],
        reminder_enabled: true,
        sort_order: 3
      }
    ]
  },
  weight_loss: {
    key: "weight_loss",
    name: "Weight Loss & Fitness",
    description: "Balanced plan focusing on regular exercise, nutrition tracking, and hydration.",
    icon: "⚖️",
    items: [
      {
        type: "activity",
        label: "Morning exercise (30 min)",
        details: {
          instructions: "Cardio, strength training, or combination"
        },
        frequency: "5x_week",
        days_of_week: [1, 2, 3, 4, 5],
        times_of_day: ["07:00"],
        reminder_enabled: true,
        sort_order: 0
      },
      {
        type: "measurement",
        label: "Track weight",
        details: {
          unit: "lbs",
          instructions: "Weigh yourself at the same time each day"
        },
        frequency: "daily",
        times_of_day: ["07:30"],
        reminder_enabled: true,
        sort_order: 1
      },
      {
        type: "other",
        label: "Log meals",
        details: {
          instructions: "Track calories and macros"
        },
        frequency: "daily",
        reminder_enabled: false,
        sort_order: 2
      },
      {
        type: "other",
        label: "Drink water (8 glasses)",
        details: {
          target_value: "64 oz",
          instructions: "Spread throughout the day"
        },
        frequency: "daily",
        reminder_enabled: true,
        sort_order: 3
      }
    ]
  },
  heart_health: {
    key: "heart_health",
    name: "Heart Health & Prevention",
    description: "Cardiovascular health plan with medication adherence, exercise, and lifestyle monitoring.",
    icon: "❤️",
    items: [
      {
        type: "medication",
        label: "Heart medication",
        details: {
          dosage: "As prescribed",
          instructions: "Take at the same time daily"
        },
        frequency: "once_daily",
        times_of_day: ["08:00"],
        reminder_enabled: true,
        sort_order: 0
      },
      {
        type: "activity",
        label: "Cardio exercise (20-30 min)",
        details: {
          instructions: "Walking, swimming, or cycling at moderate intensity"
        },
        frequency: "5x_week",
        days_of_week: [1, 2, 3, 4, 5],
        times_of_day: ["17:00"],
        reminder_enabled: true,
        sort_order: 1
      },
      {
        type: "measurement",
        label: "Monitor heart rate",
        details: {
          unit: "bpm",
          target_value: "50-85 (resting)",
          instructions: "Check resting heart rate in morning"
        },
        frequency: "daily",
        times_of_day: ["07:30"],
        reminder_enabled: true,
        sort_order: 2
      },
      {
        type: "other",
        label: "Healthy diet focus",
        details: {
          instructions: "Heart-healthy foods: fruits, vegetables, whole grains"
        },
        frequency: "daily",
        reminder_enabled: false,
        sort_order: 3
      }
    ]
  },
  custom: {
    key: "custom",
    name: "Custom Care Plan",
    description: "Create your own personalized care plan with medications, activities, and health goals.",
    icon: "✨",
    items: []
  }
};

export const getPresets = api<void, { presets: CarePlanPreset[] }>(
  { expose: true, method: "GET", path: "/care-plans/presets" },
  async () => {
    const presets = Object.values(CARE_PLAN_PRESETS);
    return { presets };
  }
);
