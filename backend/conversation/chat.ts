import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import type { ChatRequest, ChatResponse, ConversationSession } from "./types";
import type { UserProfile } from "../profile/types";
import type { ConversationEntry } from "../profile/types";
import { addFromConversation } from "../wellness_journal/add_manual";
import { buildMemoryContext, extractAndStoreMemories } from "./memory";
import { trackInteraction, getBehaviorPatterns } from "../profile/personalization";
import { updateJourneyProgress } from "../journey/update_progress";
import { addActivity } from "../morning/add_activity";
import type { MorningRoutineActivity } from "../morning/routine_types";

const openAIKey = secret("OpenAIKey");

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function updateMorningPreferences(userId: string, userMessage: string, emmaReply: string): Promise<void> {
  const combined = `${userMessage} ${emmaReply}`.toLowerCase();
  const updates: Record<string, any> = {};

  if (combined.includes("stretch") && (combined.includes("yes") || combined.includes("love to") || combined.includes("sounds good"))) {
    updates.stretching = true;
  }

  if (combined.includes("gratitude") || combined.includes("grateful")) {
    updates.gratitude = true;
  }

  if (combined.includes("meditat") || combined.includes("prayer") || combined.includes("pray")) {
    updates.meditation = true;
  }

  const musicGenres = ["classical", "jazz", "pop", "rock", "indie", "lo-fi", "lofi", "ambient", "folk", "country", "r&b", "soul", "electronic"];
  for (const genre of musicGenres) {
    if (combined.includes(genre)) {
      updates.music_genre = genre;
      break;
    }
  }

  const wakeTimeMatch = userMessage.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (wakeTimeMatch && emmaReply.toLowerCase().includes("wake")) {
    const hour = parseInt(wakeTimeMatch[1]);
    const minute = wakeTimeMatch[2] || "00";
    const period = wakeTimeMatch[3]?.toLowerCase();
    
    let formattedHour = hour;
    if (period === "pm" && hour !== 12) formattedHour += 12;
    if (period === "am" && hour === 12) formattedHour = 0;
    
    const wakeTime = `${String(formattedHour).padStart(2, "0")}:${minute}`;
    
    await db.exec`
      UPDATE user_profiles
      SET wake_time = ${wakeTime}, updated_at = NOW()
      WHERE user_id = ${userId}
    `;
  }

  if (Object.keys(updates).length > 0) {
    await db.exec`
      UPDATE user_profiles
      SET morning_routine_preferences = COALESCE(morning_routine_preferences, '{}'::jsonb) || ${JSON.stringify(updates)}::jsonb,
          updated_at = NOW()
      WHERE user_id = ${userId}
    `;
  }
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
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.statusText}`);
  }

  const data: any = await response.json();
  return data.choices[0].message.content;
}

export const chat = api<ChatRequest, ChatResponse>(
  { expose: true, method: "POST", path: "/conversation/chat" },
  async (req) => {
    const { user_id, session_type, user_message, session_id } = req;

    await trackInteraction(user_id);

    const profile = await db.queryRow<{
      id: number;
      user_id: string;
      name: string;
      wake_time?: string;
      morning_routine_preferences?: Record<string, any>;
      interaction_count?: number;
      onboarding_completed?: boolean;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, user_id, name, wake_time, morning_routine_preferences, interaction_count, onboarding_completed, created_at, updated_at
      FROM user_profiles
      WHERE user_id = ${user_id}
    `;
    
    const onboardingPrefs = await db.queryRow<{
      first_name: string | null;
      reason_for_joining: string | null;
      current_feeling: string | null;
      preferred_check_in_time: string | null;
      onboarding_completed: boolean;
    }>`
      SELECT first_name, reason_for_joining, current_feeling, preferred_check_in_time, onboarding_completed
      FROM onboarding_preferences
      WHERE user_id = ${user_id}
    `;

    let session: ConversationSession;
    if (session_id) {
      const existingSession = await db.queryRow<ConversationSession>`
        SELECT id, user_id, session_type, current_step, context, started_at, last_activity_at, completed
        FROM conversation_sessions
        WHERE id = ${session_id}
      `;
      session = existingSession!;
    } else {
      const newSession = await db.queryRow<ConversationSession>`
        INSERT INTO conversation_sessions (user_id, session_type, context)
        VALUES (${user_id}, ${session_type}, ${JSON.stringify({})})
        RETURNING id, user_id, session_type, current_step, context, started_at, last_activity_at, completed
      `;
      session = newSession!;
    }

    const recentHistoryQuery = await db.query<ConversationEntry>`
      SELECT user_message, emma_response, created_at
      FROM conversation_history
      WHERE user_id = ${user_id} 
        AND conversation_type = ${session_type}
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const recentHistory = [];
    for await (const entry of recentHistoryQuery) {
      recentHistory.push(entry);
    }

    const memoryContext = await buildMemoryContext(user_id);
    const behaviorPatterns = await getBehaviorPatterns(user_id);

    const systemPrompt = buildSystemPrompt(
      session_type, 
      profile?.name || onboardingPrefs?.first_name || "there", 
      profile?.morning_routine_preferences, 
      memoryContext,
      behaviorPatterns,
      profile?.interaction_count,
      onboardingPrefs
    );
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

    const sessionContext = session.context || {};
    if (Object.keys(sessionContext).length > 0) {
      conversationHistory.push({
        role: "system",
        content: `Current conversation context: ${JSON.stringify(sessionContext)}`
      });
    }

    conversationHistory.push({
      role: "user",
      content: user_message
    });

    const emmaReply = await callAI(conversationHistory);

    const journalEntryMatch = emmaReply.match(/JOURNAL_ENTRY:\s*(.+?)(?:\n|$)/s);
    let journalEntryId: number | undefined;
    let cleanedReply = emmaReply;
    let activityAdded = false;

    if (journalEntryMatch) {
      const journalContent = journalEntryMatch[1].trim();
      cleanedReply = emmaReply.replace(/JOURNAL_ENTRY:\s*.+?(?:\n|$)/s, '').trim();
      
      try {
        const entry = await addFromConversation({
          user_id,
          conversation_text: journalContent,
          session_type,
          title: `${session_type ? capitalizeFirst(session_type) : 'Personal'} Reflection`,
          tags: [session_type, 'conversation', 'reflection']
        });
        journalEntryId = entry.id;
      } catch (error) {
        console.error("Failed to create journal entry:", error);
      }
    }

    const routineActivityMatch = emmaReply.match(/ADD_ROUTINE_ACTIVITY:\s*\{([^}]+)\}/s);
    if (routineActivityMatch && session_type === "morning") {
      try {
        const activityData = routineActivityMatch[1].trim();
        const nameMatch = activityData.match(/name:\s*"([^"]+)"/);
        const durationMatch = activityData.match(/duration:\s*(\d+)/);
        const iconMatch = activityData.match(/icon:\s*"([^"]+)"/);
        
        if (nameMatch) {
          const activity: MorningRoutineActivity = {
            id: `activity-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            name: nameMatch[1],
            duration_minutes: durationMatch ? parseInt(durationMatch[1]) : 5,
            icon: iconMatch ? iconMatch[1] : "Circle"
          };

          await addActivity({ user_id, activity });
          activityAdded = true;
          cleanedReply = emmaReply.replace(/ADD_ROUTINE_ACTIVITY:\s*\{[^}]+\}/s, '').trim();
        }
      } catch (error) {
        console.error("Failed to add routine activity:", error);
      }
    }

    await db.exec`
      INSERT INTO conversation_history 
        (user_id, conversation_type, user_message, emma_response, context)
      VALUES 
        (${user_id}, ${session_type}, ${user_message}, ${cleanedReply}, ${JSON.stringify(sessionContext)})
    `;

    if (session_type === "morning") {
      await updateMorningPreferences(user_id, user_message, emmaReply);
    }

    await extractAndStoreMemories(user_id, user_message, cleanedReply);

    await db.exec`
      UPDATE conversation_sessions
      SET last_activity_at = NOW()
      WHERE id = ${session.id}
    `;

    const conversationComplete = cleanedReply.toLowerCase().includes("have a wonderful") || 
                                  cleanedReply.toLowerCase().includes("sleep well") ||
                                  cleanedReply.toLowerCase().includes("talk to you");

    if (conversationComplete) {
      await db.exec`
        UPDATE conversation_sessions
        SET completed = true
        WHERE id = ${session.id}
      `;
    }

    const isFirstConversation = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM conversation_history
      WHERE user_id = ${user_id}
    `;

    if (isFirstConversation && isFirstConversation.count <= 2) {
      await updateJourneyProgress(user_id, "first_conversation", true);
    }

    return {
      emma_reply: cleanedReply,
      session_id: session.id,
      conversation_complete: conversationComplete,
      journal_entry_created: !!journalEntryId,
      routine_activity_added: activityAdded
    };
  }
);

function buildSystemPrompt(
  sessionType: string, 
  userName: string, 
  morningPreferences?: Record<string, any>, 
  memoryContext?: string,
  behaviorPatterns?: any[],
  interactionCount?: number,
  onboardingPrefs?: { first_name: string | null; reason_for_joining: string | null; current_feeling: string | null; preferred_check_in_time: string | null; onboarding_completed: boolean; } | null
): string {  
  let personalizationContext = "";
  
  if (onboardingPrefs?.onboarding_completed) {
    personalizationContext += `\n\nOnboarding Information (use this to personalize the first conversation):`;
    if (onboardingPrefs.reason_for_joining) {
      personalizationContext += `\n- Joined because: ${onboardingPrefs.reason_for_joining}`;
    }
    if (onboardingPrefs.current_feeling) {
      personalizationContext += `\n- Current feeling: ${onboardingPrefs.current_feeling}`;
    }
    if (onboardingPrefs.preferred_check_in_time) {
      personalizationContext += `\n- Preferred check-in time: ${onboardingPrefs.preferred_check_in_time}`;
    }
    personalizationContext += `\n\nSince this is their first real conversation after onboarding, acknowledge their reason for joining and current feeling. Don't ask for their name - you already know they're ${userName}.`;
  }
  
  if (interactionCount && interactionCount > 1) {
    personalizationContext += `\n\nYou've had ${interactionCount} interactions with ${userName}. `;
    if (interactionCount >= 7) {
      personalizationContext += `They've been consistently engaged for a while - acknowledge this dedication warmly. `;
    }
  }

  if (behaviorPatterns && behaviorPatterns.length > 0) {
    personalizationContext += `\n\nPersonalization insights about ${userName}:`;
    behaviorPatterns.forEach(pattern => {
      if (pattern.pattern_type === "sleep_quality" && pattern.confidence_score > 0.6) {
        personalizationContext += `\n- Typically reports ${pattern.pattern_data.typical_quality} sleep`;
      }
      if (pattern.pattern_type === "wake_time" && pattern.confidence_score > 0.6) {
        personalizationContext += `\n- Usually wakes up around ${pattern.pattern_data.preferred_wake_time}`;
      }
      if (pattern.pattern_type === "morning_activity" && pattern.confidence_score > 0.6) {
        personalizationContext += `\n- Prefers ${pattern.pattern_data.preferred_activity} in the morning`;
        if (pattern.pattern_data.preferred_genre) {
          personalizationContext += ` (especially ${pattern.pattern_data.preferred_genre})`;
        }
      }
    });
    personalizationContext += `\n\nUse these insights to make the conversation feel more personal and remember what matters to them.`;
  }

  const basePrompt = `You are Emma, a warm, empathetic wellness companion. You're having a conversation with ${userName}.${memoryContext || ""}${personalizationContext}

Your personality:
- Warm, caring, and non-judgmental
- Use natural, conversational language
- Keep responses SHORT (2-3 sentences max)
- Ask one question at a time
- Show genuine interest and empathy
- Never sound robotic or clinical
- Use the person's name occasionally but not excessively

Important guidelines:
- NEVER ask multiple questions in one message
- Keep your responses concise and focused
- Build rapport through active listening
- Validate feelings before moving forward
- Don't rush through the conversation

Wellness Journal Feature:
- When ${userName} shares something meaningful (achievements, insights, challenges, breakthroughs, important realizations), you can suggest adding it to their wellness journal
- ONLY suggest this when it feels natural and the moment is truly worth preserving
- Ask something like: "That sounds really meaningful. Would you like me to add this to your wellness journal?"
- If they say yes, respond with: "JOURNAL_ENTRY: [their insight/achievement in 1-2 sentences]"
- Keep the journal entry concise and in their voice
- Don't suggest journaling too frequently - only for special moments

Morning Routine Activity Detection (ONLY for morning session_type):
- When ${userName} mentions doing or wanting to do a specific morning activity (yoga, meditation, journaling, reading, exercise, coffee ritual, etc.), you can add it to their routine
- Listen for phrases like: "I did [activity]", "I like to [activity]", "I want to start [activity]", "I usually [activity]"
- When you detect a clear morning activity they did or want to do, respond with: "ADD_ROUTINE_ACTIVITY: {name: "[activity name]", duration: [minutes], icon: "[icon]"}"
- Then confirm it in your normal reply: "I've added [activity] to your morning routine! ✨"
- Common icons: "Coffee", "Book", "Dumbbell", "Heart", "Music", "Sunrise", "Sparkles", "Circle"
- Only add activities that are clearly part of their morning, not just mentioned in passing
- Don't add duplicates - if they mention something already in their routine, just acknowledge it
`;

  let morningRoutineContext = "";
  if (morningPreferences && Object.keys(morningPreferences).length > 0) {
    morningRoutineContext = `\n\nTheir established morning routine preferences:`;
    if (morningPreferences.stretching) morningRoutineContext += `\n- Likes morning stretching`;
    if (morningPreferences.gratitude) morningRoutineContext += `\n- Practices gratitude`;
    if (morningPreferences.music_genre) morningRoutineContext += `\n- Enjoys ${morningPreferences.music_genre} music`;
    if (morningPreferences.meditation) morningRoutineContext += `\n- Practices meditation/prayer`;
    morningRoutineContext += `\n\nUse this to personalize your conversation. Ask about these activities naturally.`;
  }

  const sessionPrompts: Record<string, string> = {
    morning: `${basePrompt}${morningRoutineContext}

This is a morning check-in conversation. Your goals:
1. Ask about their sleep (naturally, not clinically)
2. Continue with their morning routine if established, or help build one if it's their first time
3. If they have preferences, ask how those activities went (stretching, gratitude, music, meditation)
4. If no preferences exist, gently explore what they'd like: stretching, gratitude practice, music preferences, meditation/prayer
5. Help them feel positive and supported
6. If they share gratitude or meaningful morning insights, consider suggesting they add it to their wellness journal

Example flow (returning user with preferences):
- "Good morning! How did you sleep?"
- Listen and empathize
- "Did you do your morning stretches?" or "What are you grateful for today?"
- If they share something meaningful: "That's beautiful. Would you like me to add that to your wellness journal?"
- Continue naturally based on their routine

Example flow (new user or building routine):
- "Good morning! How did you sleep?"
- Listen and empathize
- "Would you like to try some gentle stretches?"
- "Do you practice gratitude or meditation?"
- "What kind of music helps you wake up?"
- Help establish their preferences`, 

    evening: `${basePrompt}

This is an evening wind-down conversation. Your goals:
1. Check in on how their day went
2. Help them reflect and decompress
3. Encourage healthy evening habits
4. Support good sleep preparation
5. If they share meaningful reflections about their day, consider suggesting adding them to their wellness journal

Keep it relaxed and soothing. Don't interrogate - just chat warmly.`,

    mood: `${basePrompt}

This is a mood check-in conversation. Your goals:
1. Create a safe space for them to share how they're feeling
2. Validate their emotions without trying to "fix" them
3. Gently explore what might be influencing their mood
4. Offer support or coping strategies if appropriate

Be especially gentle and non-judgmental. Sometimes people just need to be heard.`,

    diet: `${basePrompt}

This is a nutrition conversation. Your goals:
1. Ask about what they've eaten in a curious, not judgmental way
2. Encourage awareness of how food makes them feel
3. Celebrate healthy choices
4. Be supportive about challenges

Never shame or lecture. Focus on how they FEEL, not just what they ate.`,

    doctors_orders: `${basePrompt}

This is a medication check-in conversation. Your goals:
1. Gently remind about medications if needed
2. Ask how they're feeling about their treatment
3. Log when they take medications
4. Be supportive about any challenges

Be encouraging but don't give medical advice.`,

    general: `${basePrompt}

This is an open conversation. Be responsive to what ${userName} brings up. Offer support, encouragement, and a friendly ear.`
  };

  return sessionPrompts[sessionType] || sessionPrompts.general;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
