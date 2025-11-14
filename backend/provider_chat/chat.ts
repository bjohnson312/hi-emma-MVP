import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import type { ProviderChatRequest, ProviderChatResponse, ProviderChatSession } from "./types";

const openAIKey = secret("OpenAIKey");

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ConversationEntry {
  user_message: string;
  emma_response: string;
  created_at: Date;
}

async function callAI(messages: AIMessage[]): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openAIKey()}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.statusText}`);
  }

  const data: any = await response.json();
  return data.choices[0].message.content;
}

async function getProviderAppointmentsSummary(providerId: string): Promise<string> {
  const patientCountResult = await db.queryRow<{ count: number }>`
    SELECT COUNT(DISTINCT user_id) as count
    FROM user_profiles
  `;

  const patientCount = patientCountResult?.count || 0;

  return `Today you have ${patientCount} active patients in the system.`;
}

async function searchPatientInfo(providerId: string, query: string): Promise<string> {
  const searchTerms = query.toLowerCase();
  
  const patients = await db.query<{
    user_id: string;
    name: string;
    wake_time: string | null;
    interaction_count: number;
  }>`
    SELECT user_id, name, wake_time, interaction_count
    FROM user_profiles
    LIMIT 10
  `;

  let results: any[] = [];
  for await (const patient of patients) {
    results.push(patient);
  }

  if (results.length === 0) {
    return "No patient information found.";
  }

  let summary = "Here's what I found:\n\n";
  for (const patient of results.slice(0, 5)) {
    summary += `- ${patient.name}: ${patient.interaction_count || 0} interactions`;
    if (patient.wake_time) {
      summary += `, wakes at ${patient.wake_time}`;
    }
    summary += "\n";
  }

  return summary;
}

export const chat = api<ProviderChatRequest, ProviderChatResponse>(
  { expose: true, method: "POST", path: "/provider-chat/chat" },
  async (req) => {
    const { provider_id, user_message, session_id } = req;

    let session: ProviderChatSession;
    if (session_id) {
      const existingSession = await db.queryRow<ProviderChatSession>`
        SELECT id, provider_id, context, started_at, last_activity_at, completed
        FROM provider_chat_sessions
        WHERE id = ${session_id}
      `;
      session = existingSession!;
    } else {
      const newSession = await db.queryRow<ProviderChatSession>`
        INSERT INTO provider_chat_sessions (provider_id, context)
        VALUES (${provider_id}, ${JSON.stringify({})})
        RETURNING id, provider_id, context, started_at, last_activity_at, completed
      `;
      session = newSession!;
    }

    const recentHistoryQuery = await db.query<ConversationEntry>`
      SELECT user_message, emma_response, created_at
      FROM provider_chat_history
      WHERE provider_id = ${provider_id}
        AND session_id = ${session.id}
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const recentHistory = [];
    for await (const entry of recentHistoryQuery) {
      recentHistory.push(entry);
    }

    let contextInfo = "";
    const userMessageLower = user_message.toLowerCase();
    
    if (userMessageLower.includes("appointment") || userMessageLower.includes("schedule") || userMessageLower.includes("today")) {
      contextInfo = await getProviderAppointmentsSummary(provider_id);
    }
    
    if (userMessageLower.includes("patient") || userMessageLower.includes("user")) {
      const searchInfo = await searchPatientInfo(provider_id, user_message);
      contextInfo += "\n\n" + searchInfo;
    }

    const systemPrompt = `You are Emma, an AI assistant for healthcare providers. You're helping a provider manage their practice and patient care.

Your personality:
- Professional yet warm and friendly
- Efficient and helpful
- Knowledgeable about patient care workflows
- Keep responses concise (2-4 sentences unless providing detailed information)

Your capabilities:
- Provide summaries of appointments and schedules
- Search and retrieve patient information
- Answer questions about specific patients
- Help with care team coordination
- Provide insights from patient data

Important guidelines:
- Always maintain patient confidentiality
- Provide accurate information based on available data
- If you don't have specific information, say so clearly
- Be supportive of the provider's workflow
- Keep responses professional but conversational

${contextInfo ? `\nCurrent context:\n${contextInfo}` : ""}`;

    const conversationHistory: AIMessage[] = [
      { role: "system", content: systemPrompt }
    ];

    recentHistory.reverse().forEach(entry => {
      if (entry.user_message) {
        conversationHistory.push({
          role: "user",
          content: entry.user_message
        });
      }
      conversationHistory.push({
        role: "assistant",
        content: entry.emma_response
      });
    });

    conversationHistory.push({
      role: "user",
      content: user_message
    });

    const emmaReply = await callAI(conversationHistory);

    await db.exec`
      INSERT INTO provider_chat_history 
        (provider_id, session_id, user_message, emma_response)
      VALUES 
        (${provider_id}, ${session.id}, ${user_message}, ${emmaReply})
    `;

    await db.exec`
      UPDATE provider_chat_sessions
      SET last_activity_at = NOW()
      WHERE id = ${session.id}
    `;

    const conversationComplete = emmaReply.toLowerCase().includes("is there anything else") ||
                                  emmaReply.toLowerCase().includes("anything else i can help");

    if (conversationComplete) {
      await db.exec`
        UPDATE provider_chat_sessions
        SET completed = true
        WHERE id = ${session.id}
      `;
    }

    return {
      emma_reply: emmaReply,
      session_id: session.id,
      conversation_complete: conversationComplete
    };
  }
);
