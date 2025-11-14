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
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const patientCountResult = await db.queryRow<{ count: number }>`
    SELECT COUNT(DISTINCT user_id) as count
    FROM user_profiles
  `;

  const todayActivity = await db.query<{
    user_id: string;
    name: string;
    activity_type: string;
    last_active: Date;
  }>`
    SELECT DISTINCT ON (ch.user_id)
      ch.user_id,
      up.name,
      ch.conversation_type as activity_type,
      ch.created_at as last_active
    FROM conversation_history ch
    JOIN user_profiles up ON ch.user_id = up.user_id
    WHERE ch.created_at >= CURRENT_DATE
    ORDER BY ch.user_id, ch.created_at DESC
  `;

  const upcomingCheckIns = await db.query<{
    user_id: string;
    name: string;
    preferred_time: string | null;
  }>`
    SELECT 
      up.user_id,
      up.name,
      op.preferred_check_in_time as preferred_time
    FROM user_profiles up
    LEFT JOIN onboarding_preferences op ON up.user_id = op.user_id
    WHERE up.interaction_count > 0
    ORDER BY op.preferred_check_in_time
    LIMIT 10
  `;

  let activityList: any[] = [];
  for await (const activity of todayActivity) {
    activityList.push(activity);
  }

  let upcomingList: any[] = [];
  for await (const upcoming of upcomingCheckIns) {
    upcomingList.push(upcoming);
  }

  const patientCount = patientCountResult?.count || 0;

  let summary = `**Today's Appointments & Activity Overview**\n\n`;
  summary += `Total Active Patients: ${patientCount}\n`;
  summary += `Patients Active Today: ${activityList.length}\n\n`;

  if (activityList.length > 0) {
    summary += `**Patients Who've Checked In Today:**\n`;
    activityList.forEach(activity => {
      const time = new Date(activity.last_active).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const activityName = activity.activity_type === 'morning' ? 'Morning routine' : 
                           activity.activity_type === 'evening' ? 'Evening check-in' :
                           activity.activity_type === 'mood' ? 'Mood check' :
                           'General conversation';
      summary += `- ${activity.name}: ${activityName} at ${time}\n`;
    });
    summary += `\n`;
  }

  if (upcomingList.length > 0) {
    summary += `**Scheduled Patient Check-ins:**\n`;
    upcomingList.forEach(patient => {
      if (patient.preferred_time) {
        summary += `- ${patient.name}: Prefers check-ins at ${patient.preferred_time}\n`;
      } else {
        summary += `- ${patient.name}: No preferred time set\n`;
      }
    });
  }

  return summary;
}

async function searchPatientInfo(providerId: string, query: string): Promise<string> {
  const searchTerms = query.toLowerCase();
  
  const patients = await db.query<{
    user_id: string;
    name: string;
    wake_time: string | null;
    interaction_count: number;
    onboarding_completed: boolean;
  }>`
    SELECT user_id, name, wake_time, interaction_count, onboarding_completed
    FROM user_profiles
    ORDER BY interaction_count DESC
    LIMIT 10
  `;

  let results: any[] = [];
  for await (const patient of patients) {
    results.push(patient);
  }

  if (results.length === 0) {
    return "No patient information found.";
  }

  let summary = "**Patient List:**\n\n";
  for (const patient of results) {
    summary += `**${patient.name}**\n`;
    summary += `- User ID: ${patient.user_id}\n`;
    summary += `- Interactions: ${patient.interaction_count || 0}\n`;
    summary += `- Status: ${patient.onboarding_completed ? 'Active' : 'Onboarding'}\n`;
    if (patient.wake_time) {
      summary += `- Wake Time: ${patient.wake_time}\n`;
    }
    summary += `\n`;
  }

  return summary;
}

async function getSpecificPatientInfo(providerId: string, patientName: string): Promise<string> {
  const searchPattern = `%${patientName.toLowerCase()}%`;
  
  const patient = await db.queryRow<{
    user_id: string;
    name: string;
    wake_time: string | null;
    interaction_count: number;
    onboarding_completed: boolean;
    created_at: Date;
  }>`
    SELECT user_id, name, wake_time, interaction_count, onboarding_completed, created_at
    FROM user_profiles
    WHERE LOWER(name) LIKE ${searchPattern}
    ORDER BY interaction_count DESC
    LIMIT 1
  `;

  if (!patient) {
    return `No patient found matching "${patientName}".`;
  }

  const recentActivity = await db.query<{
    conversation_type: string;
    created_at: Date;
  }>`
    SELECT conversation_type, created_at
    FROM conversation_history
    WHERE user_id = ${patient.user_id}
    ORDER BY created_at DESC
    LIMIT 5
  `;

  const careTeamMembers = await db.query<{
    name: string;
    relationship: string;
    phone: string | null;
  }>`
    SELECT name, relationship, phone
    FROM care_team_members
    WHERE user_id = ${patient.user_id}
    LIMIT 5
  `;

  let activityList: any[] = [];
  for await (const activity of recentActivity) {
    activityList.push(activity);
  }

  let careTeamList: any[] = [];
  for await (const member of careTeamMembers) {
    careTeamList.push(member);
  }

  let summary = `**Patient: ${patient.name}**\n\n`;
  summary += `**Profile:**\n`;
  summary += `- User ID: ${patient.user_id}\n`;
  summary += `- Total Interactions: ${patient.interaction_count || 0}\n`;
  summary += `- Status: ${patient.onboarding_completed ? 'Active' : 'Onboarding'}\n`;
  summary += `- Member Since: ${new Date(patient.created_at).toLocaleDateString()}\n`;
  if (patient.wake_time) {
    summary += `- Typical Wake Time: ${patient.wake_time}\n`;
  }
  summary += `\n`;

  if (activityList.length > 0) {
    summary += `**Recent Activity:**\n`;
    activityList.forEach(activity => {
      const date = new Date(activity.created_at);
      const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const activityName = activity.conversation_type === 'morning' ? 'Morning routine' : 
                           activity.conversation_type === 'evening' ? 'Evening check-in' :
                           activity.conversation_type === 'mood' ? 'Mood check' :
                           'Conversation';
      summary += `- ${activityName} (${timeStr})\n`;
    });
    summary += `\n`;
  }

  if (careTeamList.length > 0) {
    summary += `**Care Team:**\n`;
    careTeamList.forEach(member => {
      summary += `- ${member.name} (${member.relationship})`;
      if (member.phone) {
        summary += ` - ${member.phone}`;
      }
      summary += `\n`;
    });
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
    
    if (userMessageLower.includes("daily summary") || (userMessageLower.includes("summary") && userMessageLower.includes("day"))) {
      contextInfo = await getDailySummary(provider_id);
    } else if (userMessageLower.includes("appointment") || userMessageLower.includes("schedule") || 
               (userMessageLower.includes("today") && !userMessageLower.includes("summary")) ||
               userMessageLower.includes("check-in")) {
      contextInfo = await getProviderAppointmentsSummary(provider_id);
    }
    
    const patientNameMatch = userMessageLower.match(/(?:about|for|patient)\s+([a-z]+(?:\s+[a-z]+)?)/i);
    if (patientNameMatch && patientNameMatch[1]) {
      const patientName = patientNameMatch[1].trim();
      const specificInfo = await getSpecificPatientInfo(provider_id, patientName);
      contextInfo += "\n\n" + specificInfo;
    } else if ((userMessageLower.includes("patient") || userMessageLower.includes("list")) && 
               !userMessageLower.includes("summary") && 
               !patientNameMatch) {
      const searchInfo = await searchPatientInfo(provider_id, user_message);
      contextInfo += "\n\n" + searchInfo;
    }

    const systemPrompt = `You are Emma, an AI assistant for healthcare providers. You're helping a provider manage their practice and patient care.

Your personality:
- Professional yet warm and friendly
- Efficient and helpful
- Knowledgeable about patient care workflows
- Keep responses concise (2-4 sentences unless providing detailed information)
- When presenting data, format it clearly and mention key highlights

Your capabilities:
- Provide daily summaries and appointment overviews
- Show today's patient activity and check-ins
- Search and retrieve detailed patient information
- Answer questions about specific patients (by name)
- Show patient lists with activity levels
- Access care team information
- Provide insights from patient interaction data

How to help providers:
- When asked about "today" or "appointments", share the appointment summary showing:
  * Active patients today
  * Who has checked in
  * Upcoming scheduled check-ins
- When asked about a specific patient by name, provide their detailed profile including:
  * Basic information and status
  * Recent activity history
  * Care team members
- When asked about "patients" generally, show a list of all patients with their activity levels
- Use the data provided in the context below to give accurate, helpful responses
- Highlight important information (like patients who haven't checked in yet)

Important guidelines:
- Always maintain patient confidentiality
- Provide accurate information based on available data provided in the context
- If you don't have specific information, say so clearly
- Be supportive of the provider's workflow
- Keep responses professional but conversational
- When presenting lists or data, format them clearly

${contextInfo ? `\n**Current Data Context:**\n${contextInfo}` : ""}`;

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
