import type { CarePlanTask } from "./types";

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tasks: Omit<CarePlanTask, 'id' | 'care_plan_id' | 'is_active'>[];
}

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "hypertension",
    name: "Hypertension",
    description: "Blood pressure management plan",
    icon: "🩺",
    color: "from-red-500 to-pink-500",
    tasks: [
      {
        label: "Take BP medication",
        type: "medication",
        frequency: "daily",
        time_of_day: "8:00 AM",
        reminder_enabled: true,
        order_index: 0
      },
      {
        label: "Check blood pressure",
        type: "measurement",
        frequency: "daily",
        time_of_day: "9:00 AM",
        reminder_enabled: true,
        order_index: 1
      },
      {
        label: "15-minute walk",
        type: "activity",
        frequency: "daily",
        time_of_day: "5:00 PM",
        reminder_enabled: true,
        order_index: 2
      },
      {
        label: "Track sodium intake",
        type: "habit",
        frequency: "daily",
        reminder_enabled: false,
        order_index: 3
      }
    ]
  },
  {
    id: "diabetes",
    name: "Diabetes",
    description: "Blood sugar management plan",
    icon: "🍬",
    color: "from-blue-500 to-cyan-500",
    tasks: [
      {
        label: "Take diabetes medication",
        type: "medication",
        frequency: "daily",
        time_of_day: "8:00 AM",
        reminder_enabled: true,
        order_index: 0
      },
      {
        label: "Blood sugar check (morning)",
        type: "measurement",
        frequency: "daily",
        time_of_day: "8:00 AM",
        reminder_enabled: true,
        order_index: 1
      },
      {
        label: "Blood sugar check (evening)",
        type: "measurement",
        frequency: "daily",
        time_of_day: "6:00 PM",
        reminder_enabled: true,
        order_index: 2
      },
      {
        label: "20-minute walk",
        type: "activity",
        frequency: "5x/week",
        time_of_day: "5:00 PM",
        reminder_enabled: true,
        order_index: 3
      },
      {
        label: "Log meals",
        type: "habit",
        frequency: "daily",
        reminder_enabled: false,
        order_index: 4
      },
      {
        label: "Drink 8 glasses of water",
        type: "habit",
        frequency: "daily",
        reminder_enabled: false,
        order_index: 5
      }
    ]
  },
  {
    id: "post_surgery",
    name: "Post-Surgery",
    description: "Recovery and healing plan",
    icon: "🏥",
    color: "from-purple-500 to-indigo-500",
    tasks: [
      {
        label: "Take prescribed medication",
        type: "medication",
        frequency: "daily",
        time_of_day: "8:00 AM",
        reminder_enabled: true,
        order_index: 0
      },
      {
        label: "Ice therapy (morning)",
        type: "activity",
        frequency: "3x/day",
        time_of_day: "9:00 AM",
        reminder_enabled: true,
        order_index: 1
      },
      {
        label: "Ice therapy (afternoon)",
        type: "activity",
        frequency: "3x/day",
        time_of_day: "1:00 PM",
        reminder_enabled: true,
        order_index: 2
      },
      {
        label: "Ice therapy (evening)",
        type: "activity",
        frequency: "3x/day",
        time_of_day: "7:00 PM",
        reminder_enabled: true,
        order_index: 3
      },
      {
        label: "Stretching exercises (morning)",
        type: "activity",
        frequency: "2x/day",
        time_of_day: "10:00 AM",
        reminder_enabled: true,
        order_index: 4
      },
      {
        label: "Stretching exercises (evening)",
        type: "activity",
        frequency: "2x/day",
        time_of_day: "6:00 PM",
        reminder_enabled: true,
        order_index: 5
      },
      {
        label: "Log pain levels",
        type: "measurement",
        frequency: "daily",
        reminder_enabled: false,
        order_index: 6
      }
    ]
  },
  {
    id: "weight_loss",
    name: "Weight Loss",
    description: "Healthy weight management plan",
    icon: "⚖️",
    color: "from-green-500 to-emerald-500",
    tasks: [
      {
        label: "30-minute walk",
        type: "activity",
        frequency: "5x/week",
        time_of_day: "morning",
        reminder_enabled: true,
        order_index: 0
      },
      {
        label: "No sugary drinks",
        type: "habit",
        frequency: "daily",
        time_of_day: "3:00 PM",
        reminder_enabled: true,
        order_index: 1
      },
      {
        label: "Log all meals",
        type: "habit",
        frequency: "daily",
        reminder_enabled: false,
        order_index: 2
      },
      {
        label: "Eat vegetables with dinner",
        type: "habit",
        frequency: "daily",
        reminder_enabled: false,
        order_index: 3
      },
      {
        label: "Weekly weigh-in",
        type: "measurement",
        frequency: "weekly",
        time_of_day: "Monday AM",
        reminder_enabled: true,
        order_index: 4
      }
    ]
  }
];

export function getPresetById(id: string): PresetTemplate | undefined {
  return PRESET_TEMPLATES.find(preset => preset.id === id);
}

export function getAllPresets(): PresetTemplate[] {
  return PRESET_TEMPLATES;
}
