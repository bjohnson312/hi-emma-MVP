import { api } from "encore.dev/api";
import db from "../db";

export interface ConversationMemory {
  id: number;
  userId: string;
  category: string;
  key: string;
  value: string;
  context?: string;
  firstMentioned: Date;
  lastMentioned: Date;
  mentionCount: number;
  importanceScore: number;
}

export interface StoreMemoryRequest {
  category: string;
  key: string;
  value: string;
  context?: string;
  importanceScore?: number;
}

export interface GetMemoriesRequest {
  categories?: string[];
  limit?: number;
  minImportance?: number;
}

export interface GetMemoriesResponse {
  memories: ConversationMemory[];
}

export interface StoreMemoryInternalRequest extends StoreMemoryRequest {
  userId: string;
}

export const storeMemory = api(
  { method: "POST", path: "/conversation/memory", expose: true },
  async (req: StoreMemoryInternalRequest): Promise<ConversationMemory> => {
    const userId = req.userId;
    const importanceScore = req.importanceScore || 1;

    const result = await db.queryRow<ConversationMemory>`
      INSERT INTO conversation_memory (user_id, category, key, value, context, importance_score)
      VALUES (${userId}, ${req.category}, ${req.key}, ${req.value}, ${req.context || null}, ${importanceScore})
      ON CONFLICT (user_id, category, key)
      DO UPDATE SET
        value = EXCLUDED.value,
        context = COALESCE(EXCLUDED.context, conversation_memory.context),
        last_mentioned = NOW(),
        mention_count = conversation_memory.mention_count + 1,
        importance_score = GREATEST(conversation_memory.importance_score, EXCLUDED.importance_score),
        updated_at = NOW()
      RETURNING
        id,
        user_id as "userId",
        category,
        key,
        value,
        context,
        first_mentioned as "firstMentioned",
        last_mentioned as "lastMentioned",
        mention_count as "mentionCount",
        importance_score as "importanceScore"
    `;

    return result!;
  }
);

export interface GetMemoriesInternalRequest extends GetMemoriesRequest {
  userId: string;
}

export const getMemories = api(
  { method: "POST", path: "/conversation/memory/get", expose: true },
  async (req: GetMemoriesInternalRequest): Promise<GetMemoriesResponse> => {
    const userId = req.userId;
    const limit = req.limit || 20;
    const minImportance = req.minImportance || 1;

    let query = `
      SELECT
        id,
        user_id as "userId",
        category,
        key,
        value,
        context,
        first_mentioned as "firstMentioned",
        last_mentioned as "lastMentioned",
        mention_count as "mentionCount",
        importance_score as "importanceScore"
      FROM conversation_memory
      WHERE user_id = $1
        AND importance_score >= $2
    `;

    const memories: ConversationMemory[] = [];

    if (req.categories && req.categories.length > 0) {
      for await (const row of db.query<ConversationMemory>`
        SELECT
          id,
          user_id as "userId",
          category,
          key,
          value,
          context,
          first_mentioned as "firstMentioned",
          last_mentioned as "lastMentioned",
          mention_count as "mentionCount",
          importance_score as "importanceScore"
        FROM conversation_memory
        WHERE user_id = ${userId}
          AND importance_score >= ${minImportance}
          AND category = ANY(${req.categories})
        ORDER BY importance_score DESC, last_mentioned DESC
        LIMIT ${limit}
      `) {
        memories.push(row);
      }
    } else {
      for await (const row of db.query<ConversationMemory>`
        SELECT
          id,
          user_id as "userId",
          category,
          key,
          value,
          context,
          first_mentioned as "firstMentioned",
          last_mentioned as "lastMentioned",
          mention_count as "mentionCount",
          importance_score as "importanceScore"
        FROM conversation_memory
        WHERE user_id = ${userId}
          AND importance_score >= ${minImportance}
        ORDER BY importance_score DESC, last_mentioned DESC
        LIMIT ${limit}
      `) {
        memories.push(row);
      }
    }

    return { memories };
  }
);

export const extractAndStoreMemories = async (
  userId: string,
  userMessage: string,
  aiResponse: string
): Promise<void> => {
  const memoryExtractionPrompt = `Analyze this conversation exchange and extract any important personal details that should be remembered for future conversations.

User: ${userMessage}
Assistant: ${aiResponse}

Extract details in these categories:
- health_concerns: Recent health issues, symptoms, medications
- family: Family members, their names, relationships
- activities: Hobbies, favorite activities, exercise routines
- preferences: Food preferences, dislikes, routines
- goals: Health goals, wellness objectives
- work: Job, work schedule, work-related stress
- other: Any other significant personal details

Return a JSON array of memories, each with:
- category: one of the categories above
- key: a short identifier (e.g., "son_name", "knee_pain", "yoga_class")
- value: the specific detail
- importance: 1-5 (5 being most important)

Only extract genuinely important details that would be useful to remember. If there are no important details, return an empty array.

Example output:
{"memories": [
  {"category": "health_concerns", "key": "knee_pain", "value": "experiencing knee pain when climbing stairs", "importance": 4},
  {"category": "family", "key": "daughter_name", "value": "Sarah", "importance": 3}
]}`;

  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.warn("OpenAI API key not set, skipping memory extraction");
      return;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that extracts important personal details from conversations. Always respond with valid JSON only.",
          },
          { role: "user", content: memoryExtractionPrompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("Failed to extract memories:", await response.text());
      return;
    }

    const data: any = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) return;

    let memories: any[];
    try {
      const parsed = JSON.parse(content);
      memories = Array.isArray(parsed) ? parsed : parsed.memories || [];
    } catch (e) {
      console.error("Failed to parse memory extraction response:", e);
      return;
    }

    for (const memory of memories) {
      if (memory.category && memory.key && memory.value) {
        await db.exec`
          INSERT INTO conversation_memory (user_id, category, key, value, importance_score)
          VALUES (${userId}, ${memory.category}, ${memory.key}, ${memory.value}, ${memory.importance || 1})
          ON CONFLICT (user_id, category, key)
          DO UPDATE SET
            value = EXCLUDED.value,
            last_mentioned = NOW(),
            mention_count = conversation_memory.mention_count + 1,
            importance_score = GREATEST(conversation_memory.importance_score, EXCLUDED.importance_score),
            updated_at = NOW()
        `;
      }
    }
  } catch (error) {
    console.error("Error extracting memories:", error);
  }
};

export const buildMemoryContext = async (userId: string): Promise<string> => {
  const memories: ConversationMemory[] = [];
  
  for await (const row of db.query<ConversationMemory>`
    SELECT
      category,
      key,
      value,
      last_mentioned as "lastMentioned",
      mention_count as "mentionCount"
    FROM conversation_memory
    WHERE user_id = ${userId}
      AND importance_score >= 2
      AND last_mentioned > NOW() - INTERVAL '90 days'
    ORDER BY importance_score DESC, last_mentioned DESC
    LIMIT 15
  `) {
    memories.push(row);
  }

  if (memories.length === 0) {
    return "";
  }

  const groupedMemories: Record<string, string[]> = {};
  for (const memory of memories) {
    if (!groupedMemories[memory.category]) {
      groupedMemories[memory.category] = [];
    }
    groupedMemories[memory.category].push(memory.value);
  }

  let context = "\n\nIMPORTANT - Remember these details about the user from previous conversations:\n";
  for (const [category, details] of Object.entries(groupedMemories)) {
    const categoryName = category.replace(/_/g, " ");
    context += `\n${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}:\n`;
    details.forEach((detail) => {
      context += `- ${detail}\n`;
    });
  }

  context +=
    "\nNaturally reference these details when relevant to make the conversation feel more personal and attentive. Don't list them all at once.\n";

  return context;
};
