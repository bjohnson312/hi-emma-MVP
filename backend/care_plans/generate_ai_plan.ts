import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import type { GenerateAIPlanRequest, GenerateAIPlanResponse } from "./types";

const openAIKey = secret("OpenAIKey");

export const generateAIPlan = api<GenerateAIPlanRequest, GenerateAIPlanResponse>(
  { expose: true, method: "POST", path: "/care_plans/generate" },
  async ({ condition }) => {
    const apiKey = await openAIKey();

    const prompt = `You are a digital wellness assistant. Based on the user's input: "${condition}", generate 3-5 tasks to support healthy behavior and wellness. Each task should include:
- type: one of "medication", "activity", "measurement", or "habit"
- label: short, clear description of the task
- frequency: how often (e.g., "daily", "2x/day", "3x/week", "weekly")
- time_of_day (optional): suggested time if relevant (e.g., "8:00 AM", "morning", "evening")

Return ONLY a valid JSON array with no additional text. Example format:
[
  {
    "type": "medication",
    "label": "Take prescribed medication",
    "frequency": "daily",
    "time_of_day": "8:00 AM"
  },
  {
    "type": "activity",
    "label": "20-minute walk",
    "frequency": "5x/week",
    "time_of_day": "morning"
  }
]`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a helpful wellness assistant. Return only valid JSON arrays."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      const content = data.choices[0]?.message?.content || "[]";

      let tasks = JSON.parse(content.trim());

      if (!Array.isArray(tasks)) {
        tasks = [];
      }

      tasks = tasks.map((task: any, index: number) => ({
        ...task,
        reminder_enabled: false,
        order_index: index
      }));

      return { tasks };

    } catch (error) {
      console.error("AI generation failed:", error);
      
      return {
        tasks: [
          {
            type: "activity",
            label: "Daily wellness check",
            frequency: "daily"
          },
          {
            type: "habit",
            label: "Track symptoms",
            frequency: "daily"
          }
        ]
      };
    }
  }
);
