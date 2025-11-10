import { api } from "encore.dev/api";
import type { RoutineTemplate } from "./routine_types";

interface GetRoutineTemplatesResponse {
  templates: RoutineTemplate[];
}

export const getRoutineTemplates = api<{}, GetRoutineTemplatesResponse>(
  { expose: true, method: "GET", path: "/morning_routine/templates" },
  async () => {
    const templates: RoutineTemplate[] = [
      {
        id: "energizer",
        name: "The Energizer",
        description: "Quick, high-energy start to boost your mood and metabolism",
        icon: "⚡",
        color: "from-orange-500 to-red-500",
        duration_minutes: 15,
        activities: [
          { id: "wake_stretch", name: "Wake-up stretch", duration_minutes: 3, icon: "🧘", description: "Gentle full-body stretches" },
          { id: "cold_splash", name: "Cold water splash", duration_minutes: 2, icon: "💦", description: "Splash face with cold water" },
          { id: "jumping_jacks", name: "Jumping jacks", duration_minutes: 5, icon: "🤸", description: "30 jumping jacks to get blood flowing" },
          { id: "power_breakfast", name: "Power breakfast", duration_minutes: 5, icon: "🥗", description: "Protein-rich breakfast" }
        ]
      },
      {
        id: "mindful_start",
        name: "Mindful Start",
        description: "Calm, centered beginning focused on mental clarity",
        icon: "🧘",
        color: "from-purple-500 to-blue-500",
        duration_minutes: 20,
        activities: [
          { id: "meditation", name: "Meditation", duration_minutes: 10, icon: "🧘", description: "Guided or silent meditation" },
          { id: "gratitude", name: "Gratitude practice", duration_minutes: 3, icon: "🙏", description: "Write 3 things you're grateful for" },
          { id: "gentle_yoga", name: "Gentle yoga", duration_minutes: 5, icon: "🌸", description: "Simple yoga poses" },
          { id: "tea_ritual", name: "Mindful tea", duration_minutes: 2, icon: "🍵", description: "Enjoy tea mindfully" }
        ]
      },
      {
        id: "productive_morning",
        name: "Productive Morning",
        description: "Get organized and tackle your day with purpose",
        icon: "📋",
        color: "from-blue-500 to-cyan-500",
        duration_minutes: 25,
        activities: [
          { id: "review_goals", name: "Review daily goals", duration_minutes: 5, icon: "🎯", description: "Set 3 priorities for the day" },
          { id: "inbox_zero", name: "Quick email check", duration_minutes: 10, icon: "📧", description: "Review urgent emails only" },
          { id: "plan_day", name: "Plan your day", duration_minutes: 5, icon: "📅", description: "Time-block your schedule" },
          { id: "healthy_fuel", name: "Healthy breakfast", duration_minutes: 5, icon: "🍳", description: "Nutritious meal prep" }
        ]
      },
      {
        id: "wellness_warrior",
        name: "Wellness Warrior",
        description: "Complete health-focused routine for body and mind",
        icon: "💪",
        color: "from-green-500 to-teal-500",
        duration_minutes: 30,
        activities: [
          { id: "hydrate", name: "Hydration", duration_minutes: 2, icon: "💧", description: "Drink 16oz of water" },
          { id: "stretching", name: "Full body stretch", duration_minutes: 8, icon: "🤸", description: "Comprehensive stretching routine" },
          { id: "vitamins", name: "Vitamins & supplements", duration_minutes: 2, icon: "💊", description: "Take daily supplements" },
          { id: "workout", name: "Morning workout", duration_minutes: 15, icon: "🏃", description: "Light cardio or strength training" },
          { id: "smoothie", name: "Green smoothie", duration_minutes: 3, icon: "🥤", description: "Nutrient-packed smoothie" }
        ]
      },
      {
        id: "gentle_wake",
        name: "Gentle Wake-Up",
        description: "Ease into your day without rushing or stress",
        icon: "☀️",
        color: "from-yellow-400 to-orange-400",
        duration_minutes: 10,
        activities: [
          { id: "slow_wake", name: "Slow wake-up", duration_minutes: 3, icon: "😌", description: "Lie in bed and breathe deeply" },
          { id: "light_stretch", name: "Light stretch", duration_minutes: 3, icon: "🙆", description: "Simple bedside stretches" },
          { id: "favorite_music", name: "Favorite music", duration_minutes: 2, icon: "🎵", description: "Play uplifting music" },
          { id: "simple_breakfast", name: "Simple breakfast", duration_minutes: 2, icon: "🍞", description: "Quick, easy meal" }
        ]
      },
      {
        id: "custom",
        name: "Build Your Own",
        description: "Create a personalized routine that works for you",
        icon: "✨",
        color: "from-pink-500 to-purple-500",
        duration_minutes: 0,
        activities: []
      }
    ];

    return { templates };
  }
);
