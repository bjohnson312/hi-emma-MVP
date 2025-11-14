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

async function getDailySummary(providerId: string): Promise<string> {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const patientCountResult = await db.queryRow<{ count: number }>`
    SELECT COUNT(DISTINCT user_id) as count
    FROM user_profiles
  `;

  const recentMorningCheckIns = await db.query<{
    user_id: string;
    name: string;
    created_at: Date;
  }>`
    SELECT DISTINCT ON (ch.user_id) 
      ch.user_id,
      up.name,
      ch.created_at
    FROM conversation_history ch
    JOIN user_profiles up ON ch.user_id = up.user_id
    WHERE ch.conversation_type = 'morning'
      AND ch.created_at >= CURRENT_DATE
    ORDER BY ch.user_id, ch.created_at DESC
    LIMIT 10
  `;

  const recentJournalEntries = await db.query<{
    user_id: string;
    name: string;
    title: string;
    created_at: Date;
  }>`
    SELECT 
      wje.user_id,
      up.name,
      wje.title,
      wje.created_at
    FROM wellness_journal_entries wje
    JOIN user_profiles up ON wje.user_id = up.user_id
    WHERE wje.created_at >= CURRENT_DATE
    ORDER BY wje.created_at DESC
    LIMIT 5
  `;

  const activePatients = await db.query<{
    user_id: string;
    name: string;
    interaction_count: number;
    wake_time: string | null;
  }>`
    SELECT user_id, name, interaction_count, wake_time
    FROM user_profiles
    ORDER BY interaction_count DESC
    LIMIT 5
  `;

  let morningCheckInsList: any[] = [];
  for await (const checkIn of recentMorningCheckIns) {
    morningCheckInsList.push(checkIn);
  }

  let journalEntriesList: any[] = [];
  for await (const entry of recentJournalEntries) {
    journalEntriesList.push(entry);
  }

  let activePatientsList: any[] = [];
  for await (const patient of activePatients) {
    activePatientsList.push(patient);
  }

  const patientCount = patientCountResult?.count || 0;

  let summary = `📊 **Daily Summary for ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}**\n\n`;
  
  summary += `**Overview:**\n`;
  summary += `- Total Active Patients: ${patientCount}\n`;
  summary += `- Morning Check-ins Today: ${morningCheckInsList.length}\n`;
  summary += `- Journal Entries Today: ${journalEntriesList.length}\n\n`;

  if (morningCheckInsList.length > 0) {
    summary += `**Morning Check-ins Completed:**\n`;
    morningCheckInsList.forEach(checkIn => {
      const time = new Date(checkIn.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      summary += `- ${checkIn.name} (${time})\n`;
    });
    summary += `\n`;
  }

  if (journalEntriesList.length > 0) {
    summary += `**Recent Journal Entries:**\n`;
    journalEntriesList.forEach(entry => {
      const time = new Date(entry.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      summary += `- ${entry.name}: "${entry.title}" (${time})\n`;
    });
    summary += `\n`;
  }

  if (activePatientsList.length > 0) {
    summary += `**Most Active Patients:**\n`;
    activePatientsList.forEach(patient => {
      summary += `- ${patient.name}: ${patient.interaction_count || 0} interactions`;
      if (patient.wake_time) {
        summary += `, typically wakes at ${patient.wake_time}`;
      }
      summary += `\n`;
    });
  }

  return summary;
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
    
    if (userMessageLower.includes("daily summary") || userMessageLower.includes("summary") || (userMessageLower.includes("today") && userMessageLower.includes("summary"))) {
      contextInfo = await getDailySummary(provider_id);
    } else if (userMessageLower.includes("appointment") || userMessageLower.includes("schedule") || userMessageLower.includes("today")) {
      contextInfo = await getProviderAppointmentsSummary(provider_id);
    }
    
    if (userMessageLower.includes("patient") && !userMessageLower.includes("summary")) {
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
