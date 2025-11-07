import { api, StreamInOut } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import type { 
  StartNutritionChatRequest, 
  StartNutritionChatResponse,
  NutritionChatMessage,
  NutritionPlan
} from "./types";

const openAIKey = secret("OpenAIKey");

interface ChatMessageStream {
  message: string;
  done: boolean;
}

export const startNutritionChat = api<StartNutritionChatRequest, StartNutritionChatResponse>(
  { expose: true, method: "POST", path: "/wellness/nutrition-chat/start" },
  async (req) => {
    const sessionId = `nutrition_${req.user_id}_${Date.now()}`;
    
    const initialMessage = `Hi! I'm here to help you create a personalized nutrition plan. Let's chat about your eating habits and goals.\n\nTo get started, tell me:\n1. What are your main nutrition or health goals? (e.g., weight management, more energy, manage a condition)\n2. Do you have any dietary restrictions or preferences? (e.g., vegetarian, vegan, gluten-free, allergies)\n3. What does a typical day of eating look like for you?`;

    await db.exec`
      INSERT INTO nutrition_chat_sessions (id, user_id, conversation_history, completed)
      VALUES (${sessionId}, ${req.user_id}, ${JSON.stringify([
        { role: "assistant", content: initialMessage, timestamp: new Date() }
      ])}, false)
    `;

    return {
      session_id: sessionId,
      initial_message: initialMessage
    };
  }
);

export const nutritionChatStream = api.streamInOut<ChatMessageStream, ChatMessageStream>(
  { expose: true, path: "/wellness/nutrition-chat/stream" },
  async (stream) => {
    for await (const message of stream) {
      if (message.done) {
        break;
      }

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openAIKey()}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are a friendly nutrition assistant helping users create personalized nutrition plans. 
                
Your job is to:
1. Ask about their nutrition goals (weight management, energy, disease management, etc.)
2. Learn about dietary restrictions and preferences (vegetarian, vegan, allergies, etc.)
3. Understand their current eating habits
4. Ask about activity level and lifestyle
5. Gather any health conditions that affect diet

Be conversational, empathetic, and ask one question at a time. When you have enough information (after 3-5 exchanges), summarize what you learned and ask if they'd like you to create their personalized plan.

Keep responses concise (2-3 sentences max).`
              },
              { role: "user", content: message.message }
            ]
          })
        });

        const data = await response.json() as any;
        const assistantMessage = data.choices[0].message.content;

        await stream.send({
          message: assistantMessage,
          done: false
        });
      } catch (error) {
        await stream.send({
          message: "I'm having trouble processing that. Could you try rephrasing?",
          done: false
        });
      }
    }
  }
);

interface SendChatMessageRequest {
  session_id: string;
  user_id: string;
  message: string;
}

interface SendChatMessageResponse {
  response: string;
  plan_ready: boolean;
}

export const sendChatMessage = api<SendChatMessageRequest, SendChatMessageResponse>(
  { expose: true, method: "POST", path: "/wellness/nutrition-chat/message" },
  async (req) => {
    const session = await db.queryRow<{ conversation_history: any, completed: boolean }>`
      SELECT conversation_history, completed
      FROM nutrition_chat_sessions
      WHERE id = ${req.session_id} AND user_id = ${req.user_id}
    `;

    if (!session) {
      throw new Error("Session not found");
    }

    const history: NutritionChatMessage[] = session.conversation_history || [];
    history.push({
      role: "user",
      content: req.message,
      timestamp: new Date()
    });

    const messages = history.map(h => ({
      role: h.role,
      content: h.content
    }));

    const systemPrompt = {
      role: "system",
      content: `You are a friendly nutrition assistant helping users create personalized nutrition plans. 

Your job is to:
1. Ask about their nutrition goals (weight management, energy, disease management, etc.)
2. Learn about dietary restrictions and preferences (vegetarian, vegan, allergies, etc.)
3. Understand their current eating habits
4. Ask about activity level and lifestyle
5. Gather any health conditions that affect diet

Be conversational, empathetic, and ask one question at a time. When you have enough information (after 3-5 exchanges), say "I have everything I need! Let me create your personalized nutrition plan." and then respond with a JSON object in this format:
{
  "plan_ready": true,
  "goals": ["goal1", "goal2"],
  "dietary_preferences": "description",
  "calorie_target": 2000,
  "protein_target_g": 150,
  "carbs_target_g": 200,
  "fat_target_g": 65,
  "meal_suggestions": {
    "breakfast": ["suggestion1", "suggestion2"],
    "lunch": ["suggestion1", "suggestion2"],
    "dinner": ["suggestion1", "suggestion2"],
    "snacks": ["suggestion1", "suggestion2"]
  }
}

Otherwise, keep responses concise (2-3 sentences max) and continue the conversation.`
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIKey()}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [systemPrompt, ...messages]
      })
    });

    const data = await response.json() as any;
    const assistantMessage = data.choices[0].message.content;

    let planReady = false;
    let responseText = assistantMessage;

    if (assistantMessage.includes('"plan_ready": true')) {
      try {
        const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const planData = JSON.parse(jsonMatch[0]);
          
          await db.exec`
            INSERT INTO nutrition_plans 
              (user_id, plan_name, goals, dietary_preferences, calorie_target, 
               protein_target_g, carbs_target_g, fat_target_g, meal_suggestions, active)
            VALUES 
              (${req.user_id}, 'My Nutrition Plan', ${planData.goals}, 
               ${planData.dietary_preferences}, ${planData.calorie_target},
               ${planData.protein_target_g}, ${planData.carbs_target_g}, 
               ${planData.fat_target_g}, ${JSON.stringify(planData.meal_suggestions)}, true)
          `;

          await db.exec`
            UPDATE nutrition_chat_sessions
            SET completed = true, preferences_extracted = ${JSON.stringify(planData)}
            WHERE id = ${req.session_id}
          `;

          planReady = true;
          responseText = "Great! I've created your personalized nutrition plan. You can view it in the main nutrition section.";
        }
      } catch (e) {
        responseText = assistantMessage;
      }
    }

    history.push({
      role: "assistant",
      content: responseText,
      timestamp: new Date()
    });

    await db.exec`
      UPDATE nutrition_chat_sessions
      SET conversation_history = ${JSON.stringify(history)}, updated_at = NOW()
      WHERE id = ${req.session_id}
    `;

    return {
      response: responseText,
      plan_ready: planReady
    };
  }
);

interface GetChatHistoryRequest {
  session_id: string;
  user_id: string;
}

interface GetChatHistoryResponse {
  messages: NutritionChatMessage[];
  completed: boolean;
}

export const getChatHistory = api<GetChatHistoryRequest, GetChatHistoryResponse>(
  { expose: true, method: "GET", path: "/wellness/nutrition-chat/:session_id/:user_id" },
  async (req) => {
    const session = await db.queryRow<{ conversation_history: any, completed: boolean }>`
      SELECT conversation_history, completed
      FROM nutrition_chat_sessions
      WHERE id = ${req.session_id} AND user_id = ${req.user_id}
    `;

    if (!session) {
      throw new Error("Session not found");
    }

    return {
      messages: session.conversation_history || [],
      completed: session.completed
    };
  }
);
