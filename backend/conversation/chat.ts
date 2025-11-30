/**
 * CONVERSATION CHAT ENDPOINT - UNIFIED PILLAR ARCHITECTURE
 * 
 * This file implements the clean, unified workflow for ALL wellness pillars:
 * 
 * WORKFLOW: User Message → Intent Detection → Action → Database Update → Journal Logging → Memory Update → Response
 * 
 * ✅ IMPLEMENTED PILLARS:
 * - Morning Routine: Full unified workflow with auto-creation, journal logging, and memory updates
 * 
 * 🚧 TO BE IMPLEMENTED (using same pattern):
 * - Doctor's Orders
 * - Diet & Nutrition  
 * - Mood/How Are You Feeling
 * - Evening Routine
 * 
 * KEY ARCHITECTURAL PRINCIPLES:
 * 1. Never fail due to missing data - auto-create if needed
 * 2. All pillar data goes to dedicated tables (not JSONB fields in user_profiles)
 * 3. Every action logs to the pillar's journal table
 * 4. Significant changes update Emma's memory
 * 5. System responds naturally in conversation
 * 
 * MORNING ROUTINE WORKFLOW (Template for all pillars):
 * - User mentions activity → processMorningRoutineActivity() 
 * - Check if routine exists → Create if missing
 * - Add activity to morning_routine_preferences table
 * - Log to morning_routine_journal table
 * - Update Emma Memory via extractAndStoreMemories()
 * - Return confirmation in chat
 * 
 * This pattern ensures clean separation, proper logging, and consistent UX across all pillars.
 */

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
import type { MorningRoutineActivity, MorningRoutinePreference } from "../morning/routine_types";
import { logJournalEntry } from "../morning/add_journal_entry";
import { detectIntents } from "../insights/detect_intents";
import { applySuggestion } from "../insights/apply_suggestion";

const openAIKey = secret("OpenAIKey");

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * UNIFIED MORNING ROUTINE WORKFLOW
 * This implements the clean architecture for conversation → action → database → journal → memory
 * This pattern will be replicated for all other pillars (Diet, Doctor's Orders, Mood, Evening Routine)
 */

/**
 * Process morning routine activity mentioned in conversation
 * Workflow: detect activity → check if routine exists → create routine if needed → add activity → log to journal → update memory
 */
async function processMorningRoutineActivity(
  userId: string, 
  activity: MorningRoutineActivity,
  context: { userMessage: string; emmaReply: string }
): Promise<void> {
  console.log(`\n🔧 processMorningRoutineActivity START`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Activity: ${activity.name} (${activity.duration_minutes} min, ${activity.icon})`);
  
  try {
    // Check if user has an active morning routine
    console.log(`   📊 Checking for existing routine...`);
    const existingRoutine = await db.queryRow<MorningRoutinePreference>`
      SELECT * FROM morning_routine_preferences
      WHERE user_id = ${userId} AND is_active = true
    `;
    
    if (existingRoutine) {
      console.log(`   ✅ Found existing routine:`, existingRoutine.routine_name);
      
      // DIAGNOSTIC LOGGING - Database Response
      console.log(`\n📦 DIAGNOSTIC - RAW DATABASE RESPONSE:`);
      console.log(`   typeof activities:`, typeof existingRoutine.activities);
      console.log(`   Array.isArray(activities):`, Array.isArray(existingRoutine.activities));
      console.log(`   Raw activities:`, JSON.stringify(existingRoutine.activities, null, 2));
      console.log(`   Activities length:`, existingRoutine.activities?.length);
    } else {
      console.log(`   ℹ️  No existing routine found - will create new one`);
    }

    if (!existingRoutine) {
      // FIX 1: Auto-create routine if missing (never fail with "No active morning routine")
      console.log(`✨ Creating new morning routine for user ${userId} with first activity: ${activity.name}`);
      
      await db.exec`
        INSERT INTO morning_routine_preferences (
          user_id, 
          routine_name, 
          activities, 
          duration_minutes,
          is_active
        ) VALUES (
          ${userId}, 
          'My Morning Routine',
          ${JSON.stringify([activity])}::jsonb,
          ${activity.duration_minutes || 5},
          true
        )
      `;

      console.log(`   ✅ Routine created in DB`);

      // FIX 3: Log to morning routine journal
      console.log(`   📝 Logging to journal...`);
      await logJournalEntry(
        userId,
        "routine_created",
        `Created morning routine with first activity: ${activity.name}`,
        activity.name,
        { duration_minutes: activity.duration_minutes, icon: activity.icon, source: "conversation" }
      );
      console.log(`   ✅ Journal entry created`);

      // FIX 4: Update Emma Memory
      console.log(`   🧠 Updating Emma Memory...`);
      await extractAndStoreMemories(
        userId, 
        context.userMessage,
        `I've created your morning routine with ${activity.name}. This will help you start your day with intention.`
      );
      console.log(`   ✅ Memory updated`);

      console.log(`✅ Morning routine created successfully\n`);
      return;
    }

    // Routine exists - add activity to it
    const currentActivities = typeof existingRoutine.activities === 'string' 
      ? JSON.parse(existingRoutine.activities)
      : existingRoutine.activities;

    const activitiesArray: MorningRoutineActivity[] = Array.isArray(currentActivities) 
      ? currentActivities 
      : [];

    // DIAGNOSTIC LOGGING - After Parsing
    console.log(`\n🔄 DIAGNOSTIC - AFTER PARSING:`);
    console.log(`   typeof currentActivities:`, typeof currentActivities);
    console.log(`   Parsed currentActivities:`, JSON.stringify(currentActivities, null, 2));
    console.log(`   activitiesArray:`, JSON.stringify(activitiesArray, null, 2));
    console.log(`   activitiesArray.length:`, activitiesArray.length);

    // Check for duplicates
    const isDuplicate = activitiesArray.some(
      a => a.name.toLowerCase() === activity.name.toLowerCase()
    );

    // DIAGNOSTIC LOGGING - Duplicate Check
    console.log(`\n🔍 DIAGNOSTIC - DUPLICATE CHECK:`);
    console.log(`   New activity name (lowercased):`, activity.name.toLowerCase());
    console.log(`   Existing activity names:`, activitiesArray.map(a => `"${a.name.toLowerCase()}"`));
    console.log(`   Is duplicate?:`, isDuplicate);

    if (isDuplicate) {
      console.log(`ℹ️  Activity "${activity.name}" already exists in routine, skipping`);
      return;
    }

    // Add new activity
    const newActivities = [...activitiesArray, activity];
    const newDuration = (existingRoutine.duration_minutes || 0) + (activity.duration_minutes || 0);

    // DIAGNOSTIC LOGGING - Before Update
    console.log(`\n💾 DIAGNOSTIC - BEFORE UPDATE:`);
    console.log(`   Old activities count:`, activitiesArray.length);
    console.log(`   New activities count:`, newActivities.length);
    console.log(`   Full new activities:`, JSON.stringify(newActivities, null, 2));

    console.log(`   💾 Updating routine in DB...`);
    await db.exec`
      UPDATE morning_routine_preferences
      SET activities = ${JSON.stringify(newActivities)}::jsonb,
          duration_minutes = ${newDuration},
          updated_at = NOW()
      WHERE user_id = ${userId} AND is_active = true
    `;
    console.log(`   ✅ Routine updated in DB`);

    // FIX 3: Log to morning routine journal
    console.log(`   📝 Logging to journal...`);
    await logJournalEntry(
      userId,
      "activity_added",
      `Added new activity: ${activity.name}`,
      activity.name,
      { duration_minutes: activity.duration_minutes, icon: activity.icon, source: "conversation" }
    );
    console.log(`   ✅ Journal entry created`);

    // FIX 4: Update Emma Memory
    console.log(`   🧠 Updating Emma Memory...`);
    await extractAndStoreMemories(
      userId,
      context.userMessage,
      `I've added ${activity.name} to your morning routine.`
    );
    console.log(`   ✅ Memory updated`);

    console.log(`✅ Activity "${activity.name}" added to existing routine\n`);

  } catch (error) {
    console.error("\n❌ FAILED to process morning routine activity");
    console.error("   Error details:", error);
    console.error("   User ID:", userId);
    console.error("   Activity:", activity);
    throw error;
  }
}

/**
 * Extract activity name from Emma's natural reply
 * Returns null if no activity addition detected
 */
function extractActivityFromReply(reply: string): string | null {
  const patterns = [
    /I['']?ve added ([^.!]+) to your (?:morning )?routine/i,
    /added ([^.!]+) to your (?:morning )?routine/i,
    /([^.!]+) (?:is now|has been added) (?:to|part of) your routine/i,
    /I added ([^.!]+) to your routine/i,
  ];
  
  for (const pattern of patterns) {
    const match = reply.match(pattern);
    if (match) {
      return cleanActivityName(match[1]);
    }
  }
  
  return null;
}

/**
 * Clean up extracted activity name
 */
function cleanActivityName(raw: string): string {
  return raw
    .replace(/^(a|an|the)\s+/i, '')
    .replace(/['"]\s*/g, '')
    .trim();
}

/**
 * Infer duration based on activity name
 */
function inferDuration(activityName: string): number {
  const lowerName = activityName.toLowerCase();
  
  const durationMap: Record<string, number> = {
    'meditation': 15,
    'yoga': 20,
    'stretching': 10,
    'situps': 5,
    'sit-ups': 5,
    'sit ups': 5,
    'pushups': 5,
    'push-ups': 5,
    'push ups': 5,
    'shower': 10,
    'breakfast': 15,
    'exercise': 10,
    'workout': 15,
    'coffee': 5,
    'tea': 5,
    'reading': 15,
    'journal': 10,
  };
  
  // Check exact match
  if (durationMap[lowerName]) return durationMap[lowerName];
  
  // Check partial match
  for (const [key, duration] of Object.entries(durationMap)) {
    if (lowerName.includes(key)) return duration;
  }
  
  return 10; // Default
}

/**
 * Infer icon based on activity name
 */
function inferIcon(activityName: string): string {
  const lowerName = activityName.toLowerCase();
  
  const iconMap: Record<string, string> = {
    'meditation': '🧘',
    'yoga': '🧘',
    'stretching': '🤸',
    'situps': '💪',
    'sit-ups': '💪',
    'sit ups': '💪',
    'pushups': '💪',
    'push-ups': '💪',
    'push ups': '💪',
    'exercise': '💪',
    'workout': '💪',
    'shower': '🚿',
    'breakfast': '🍳',
    'coffee': '☕',
    'tea': '🍵',
    'reading': '📖',
    'journal': '📝',
  };
  
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) return icon;
  }
  
  return '⭐'; // Default
}

/**
 * Extract activities from user describing their existing routine
 * Patterns: "my exercises are X and Y", "my routine includes X", etc.
 * Returns array of activity names
 */
function extractActivitiesFromUserDescription(userMessage: string): string[] {
  const activities: string[] = [];
  
  const patterns = [
    // "my exercises are HIIT and 2 mile walk"
    /my exercises?\s+(?:are|is|include|of)\s+([^.!?]+)/i,
    // "my routine includes yoga and meditation"
    /my routine\s+(?:includes?|is|consists? of)\s+([^.!?]+)/i,
    // "I do yoga and meditation in the morning"
    /I (?:do|practice)\s+([^.!?]+?)\s+(?:in the morning|every morning|each morning|daily)/i,
    // "I usually do X and Y"
    /I usually (?:do|practice)\s+([^.!?]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = userMessage.match(pattern);
    if (match) {
      const activityList = match[1];
      
      // Split by "and" or commas
      const splitActivities = activityList.split(/\s+and\s+|,\s+/);
      
      splitActivities.forEach(rawActivity => {
        const cleaned = cleanActivityName(rawActivity.trim());
        if (cleaned && cleaned.length > 0) {
          activities.push(cleaned);
        }
      });
      
      break; // Only process first match
    }
  }
  
  return activities;
}

/**
 * Detect morning routine CRUD operations from user message
 * Phase 1: View operation
 * Phase 2: Update operation (duration and name changes)
 * Phase "Complete": Complete/check off operation
 * Phase "Complete All": Mark entire routine complete
 * 
 * Returns operation type and extracted data for CRUD operations
 */
function detectMorningRoutineCRUDIntent(userMessage: string): {
  operation: 'view' | 'update' | 'complete' | 'complete_all' | null;
  activityName?: string;
  newDuration?: number;
  newName?: string;
} {
  const msg = userMessage.toLowerCase();
  
  // COMPLETE ALL patterns - Mark entire routine complete
  const completeAllPatterns = [
    /(?:I\s+)?(?:finished|completed|did|got\s+through)\s+(?:my\s+)?(?:whole|entire|full)\s+(?:morning\s+)?routine/i,
    /(?:I\s+)?(?:finished|completed|did)\s+(?:all|everything)(?:\s+in\s+my\s+morning\s+routine)?/i,
    /checked?\s+off\s+(?:my\s+)?(?:entire|whole|full)\s+routine/i,
    /(?:I\s+)?did\s+all\s+my\s+morning\s+(?:tasks|activities)/i,
    /(?:I\s+)?did\s+everything\s+this\s+morning/i,
  ];
  
  for (const pattern of completeAllPatterns) {
    if (pattern.test(userMessage)) {
      return { operation: 'complete_all' };
    }
  }
  
  // COMPLETE patterns - Mark single activity as done
  const completePatterns = [
    /(?:I\s+)?(?:just\s+)?(?:did|finished|completed|done)(?:\s+my)?\s+(.+?)(?:\s+this\s+morning)?$/i,
    /(?:I'?ve?\s+)?done\s+(?:my\s+)?(.+?)$/i,
    /(?:just\s+)?checked?\s+off\s+(.+?)$/i,
    /(?:I\s+)?did\s+my\s+(.+?)$/i,
    /(?:I\s+)?finished\s+my\s+(.+?)$/i,
    /(?:I\s+)?completed\s+my\s+(.+?)$/i,
  ];
  
  for (const pattern of completePatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      return {
        operation: 'complete',
        activityName: match[1].trim()
      };
    }
  }
  
  // UPDATE patterns - Duration changes
  const updateDurationPatterns = [
    /(?:change|update|make|set)\s+(.+?)\s+to\s+(\d+)\s*(?:min|minutes?)/i,
    /(?:change|update)\s+(.+?)\s+(?:duration|time)\s+to\s+(\d+)/i,
    /make\s+(.+?)\s+(\d+)\s*(?:min|minutes?)/i,
    /set\s+(.+?)\s+(?:to|at)\s+(\d+)\s*(?:min|minutes?)/i,
    /(?:change|update)\s+(?:the\s+)?(?:duration|time)\s+(?:of|for)\s+(.+?)\s+to\s+(\d+)/i,
  ];
  
  for (const pattern of updateDurationPatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      return {
        operation: 'update',
        activityName: match[1].trim(),
        newDuration: parseInt(match[2])
      };
    }
  }
  
  // UPDATE patterns - Name changes
  const updateNamePatterns = [
    /(?:rename|change\s+(?:the\s+)?name\s+of)\s+(.+?)\s+to\s+(.+?)(?:\.|$)/i,
    /call\s+(.+?)\s+(.+?)\s+instead/i,
  ];
  
  for (const pattern of updateNamePatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      return {
        operation: 'update',
        activityName: match[1].trim(),
        newName: match[2].trim()
      };
    }
  }
  
  // VIEW patterns
  const viewPatterns = [
    /what'?s?\s+in\s+my\s+(?:morning\s+)?routine/i,
    /show\s+(?:me\s+)?my\s+(?:morning\s+)?routine/i,
    /list\s+(?:my\s+)?(?:morning\s+)?routine/i,
    /view\s+(?:my\s+)?(?:morning\s+)?routine/i,
    /what\s+do\s+I\s+do\s+in\s+(?:the\s+)?morning/i,
    /what\s+(?:are\s+)?my\s+morning\s+activities/i,
    /(?:my\s+)?morning\s+routine\s+activities/i,
  ];
  
  for (const pattern of viewPatterns) {
    if (pattern.test(userMessage)) {
      return { operation: 'view' };
    }
  }
  
  return { operation: null };
}

/**
 * Update wake time from conversation
 * Workflow: extract time → update profile → log to journal → update memory
 */
async function updateWakeTime(
  userId: string, 
  wakeTime: string,
  context: { userMessage: string; emmaReply: string }
): Promise<void> {
  try {
    // Update in user profile
    await db.exec`
      UPDATE user_profiles
      SET wake_time = ${wakeTime}, updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    // Also update in morning routine preferences if exists
    await db.exec`
      UPDATE morning_routine_preferences
      SET wake_time = ${wakeTime}, updated_at = NOW()
      WHERE user_id = ${userId} AND is_active = true
    `;

    // Log to journal
    await logJournalEntry(
      userId,
      "routine_edited",
      `Updated wake time to ${wakeTime}`,
      undefined,
      { wake_time: wakeTime, source: "conversation" }
    );

    // Update Emma Memory
    await extractAndStoreMemories(
      userId,
      context.userMessage,
      `I've noted that you wake up at ${wakeTime}.`
    );

    console.log(`✅ Wake time updated to ${wakeTime}`);
  } catch (error) {
    console.error("❌ Failed to update wake time:", error);
    throw error;
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
      model: "gpt-4o",
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
    console.log("\n🚀🚀🚀 CHAT ENDPOINT CALLED! 🚀🚀🚀");
    console.log("   User ID:", req.user_id);
    console.log("   Session Type:", req.session_type);
    console.log("   Message:", req.user_message);
    console.log("   Session ID:", req.session_id);
    
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

    // PHASE 1: Morning Routine CRUD Operations - View Only
    if (session_type === "morning") {
      // CRITICAL: Check for pending clarification FIRST (before intent detection)
      // Parse session.context safely (PostgreSQL JSONB may return as string or object)
      const rawContext = session.context;
      const sessionContext = typeof rawContext === 'string' 
        ? (() => {
            console.log("   🔍 [Context Parse] session.context returned as string, parsing...");
            return JSON.parse(rawContext);
          })()
        : rawContext || {};
      
      const pendingCompletion = sessionContext.pendingCompletion;
      
      if (pendingCompletion && pendingCompletion.type === 'activity_completion_clarification') {
        console.log("   🔔 [Morning Complete] Pending clarification detected BEFORE intent check", {
          hasPending: !!pendingCompletion,
          candidatesCount: pendingCompletion?.candidates?.length,
          userMessage: user_message
        });
        
        // Handle clarification follow-up (moved from inside complete handler)
        const { findActivityMatches, PENDING_CLARIFICATION_TIMEOUT_MS } = await import("../morning/activity_utils");
        const { markActivityComplete } = await import("../morning/mark_activity_complete");
        
        const now = Date.now();
        const isExpired = now - pendingCompletion.timestamp > PENDING_CLARIFICATION_TIMEOUT_MS;
        
        if (isExpired) {
          console.log("   ⏱️  Clarification expired, clearing context");
          await db.exec`
            UPDATE conversation_sessions
            SET context = '{}'::jsonb
            WHERE id = ${session.id}
          `;
          // Continue to normal intent detection below
        } else {
          // Process clarification follow-up
          const followUpText = user_message.toLowerCase().trim();
          
          // Check for cancel keywords
          const cancelKeywords = ['neither', 'none', 'cancel', 'never mind', 'nevermind', 'no', 'no thanks'];
          if (cancelKeywords.some(kw => followUpText === kw || followUpText.includes(kw))) {
            console.log("   ❌ User canceled clarification");
            
            const cancelReply = "No problem. I won't mark anything complete. If you'd like, you can tell me the exact activity you finished.";
            
            await db.exec`
              UPDATE conversation_sessions
              SET context = '{}'::jsonb,
                  last_activity_at = NOW()
              WHERE id = ${session.id}
            `;
            
            await db.exec`
              INSERT INTO conversation_history 
                (user_id, conversation_type, user_message, emma_response)
              VALUES (${user_id}, ${session_type}, ${user_message}, ${cancelReply})
            `;
            
            return {
              emma_reply: cancelReply,
              session_id: session.id,
              conversation_complete: false
            };
          }
          
          // Parse number selection (1, 2, 3)
          const numberMatch = followUpText.match(/^\s*(\d+)\s*$/);
          let resolvedActivity: { activityId: string; activityName: string } | null = null;
          
          if (numberMatch) {
            const choiceNum = parseInt(numberMatch[1]);
            const choiceIndex = choiceNum - 1;
            
            console.log(`   🔢 [Numeric Choice] User replied with number: ${choiceNum} (index: ${choiceIndex})`);
            
            if (choiceIndex >= 0 && choiceIndex < pendingCompletion.candidates.length) {
              resolvedActivity = pendingCompletion.candidates[choiceIndex];
              console.log(`   ✅ [Numeric Choice] Resolved to: "${resolvedActivity.activityName}"`);
            } else {
              console.log(`   ❌ [Numeric Choice] Index out of bounds (candidates: ${pendingCompletion.candidates.length})`);
            }
          }
          
          // Parse text match within candidates
          if (!resolvedActivity) {
            const matchResult = findActivityMatches(
              user_message,
              pendingCompletion.candidates.map((c: any) => ({ 
                id: c.activityId, 
                name: c.activityName 
              }))
            );
            
            if (matchResult.bestMatch) {
              resolvedActivity = {
                activityId: matchResult.bestMatch.activity.id,
                activityName: matchResult.bestMatch.activity.name
              };
              console.log(`   ✅ Resolved by name match: "${resolvedActivity.activityName}"`);
            }
          }
          
          // If we resolved an activity, mark it complete
          if (resolvedActivity) {
            console.log(`   ✅ [Clarification Handler] Calling markActivityComplete`, {
              activityId: resolvedActivity.activityId,
              activityName: resolvedActivity.activityName
            });
            
            try {
              const result = await markActivityComplete({
                user_id,
                activity_identifier: resolvedActivity.activityName
              });
              
              console.log(`   ✅ [Clarification Handler] markActivityComplete succeeded`, {
                matched: result.matched_activity_name,
                completed_today: result.activities_completed_today,
                total: result.total_activities,
                all_complete: result.all_completed
              });
              
              let completeReply: string;
              if (result.already_complete) {
                completeReply = `You're on it! ${result.matched_activity_name} is already marked as complete for today. Keep going—you've got this.`;
              } else if (result.all_completed) {
                completeReply = `🎉 Amazing! You've completed ${result.matched_activity_name} and finished your entire morning routine (${result.total_activities}/${result.total_activities} activities). You're crushing it today!`;
              } else {
                const remaining = result.total_activities - result.activities_completed_today;
                completeReply = `Great job! I've marked ${result.matched_activity_name} as complete. ${remaining} more to go!`;
              }
              
              // Clear context
              await db.exec`
                UPDATE conversation_sessions
                SET context = '{}'::jsonb,
                    last_activity_at = NOW()
                WHERE id = ${session.id}
              `;
              
              await db.exec`
                INSERT INTO conversation_history 
                  (user_id, conversation_type, user_message, emma_response, context)
                VALUES 
                  (${user_id}, ${session_type}, ${user_message}, ${completeReply}, 
                   ${JSON.stringify({ 
                     crud_operation: 'complete',
                     clarification_resolved: true,
                     activity_name: result.matched_activity_name,
                     activities_completed_today: result.activities_completed_today,
                     total_activities: result.total_activities,
                     all_completed: result.all_completed
                   })})
              `;
              
              return {
                emma_reply: completeReply,
                session_id: session.id,
                conversation_complete: result.all_completed
              };
            } catch (error: any) {
              console.log("❌ [Clarification Handler] markActivityComplete failed:", error.message);
              const errorReply = `I had trouble marking that activity as complete. ${error.message}`;
              
              await db.exec`
                UPDATE conversation_sessions
                SET context = '{}'::jsonb,
                    last_activity_at = NOW()
                WHERE id = ${session.id}
              `;
              
              await db.exec`
                INSERT INTO conversation_history 
                  (user_id, conversation_type, user_message, emma_response)
                VALUES (${user_id}, ${session_type}, ${user_message}, ${errorReply})
              `;
              
              return {
                emma_reply: errorReply,
                session_id: session.id,
                conversation_complete: false
              };
            }
          } else {
            // Couldn't resolve - ask for clarification again
            const retryReply = `I'm not sure which one you mean. Please reply with the number (1, 2, or 3) or the full activity name.`;
            
            await db.exec`
              UPDATE conversation_sessions
              SET last_activity_at = NOW()
              WHERE id = ${session.id}
            `;
            
            await db.exec`
              INSERT INTO conversation_history 
                (user_id, conversation_type, user_message, emma_response)
              VALUES (${user_id}, ${session_type}, ${user_message}, ${retryReply})
            `;
            
            return {
              emma_reply: retryReply,
              session_id: session.id,
              conversation_complete: false
            };
          }
        }
      }
      
      // No pending clarification - continue with normal intent detection
      const crudIntent = detectMorningRoutineCRUDIntent(user_message);
      
      if (crudIntent.operation === 'view') {
        console.log("🔍 CRUD: View operation detected");
        
        const { listActivities } = await import("../morning/list_activities");
        const result = await listActivities({ user_id });
        
        let viewReply: string;
        
        if (result.activities.length === 0) {
          viewReply = "You don't have a morning routine set up yet. Want to start one together?";
        } else {
          const activityList = result.activities
            .map((a, i) => `${i + 1}. ${a.name}${a.duration_minutes ? ` (${a.duration_minutes} min)` : ''}`)
            .join('\n');
          
          const totalTime = result.total_duration;
          viewReply = `Here's your morning routine right now:\n\n${activityList}\n\nTotal time: ${totalTime} minutes.\n\nWould you like to add or change anything?`;
        }
        
        console.log("✅ CRUD: View response:", viewReply.substring(0, 100) + "...");
        
        await db.exec`
          INSERT INTO conversation_history 
            (user_id, conversation_type, user_message, emma_response, context)
          VALUES 
            (${user_id}, ${session_type}, ${user_message}, ${viewReply}, 
             ${JSON.stringify({ crud_operation: 'view', activities_count: result.activities.length })})
        `;
        
        await db.exec`
          UPDATE conversation_sessions
          SET last_activity_at = NOW()
          WHERE id = ${session.id}
        `;
        
        return {
          emma_reply: viewReply,
          session_id: session.id,
          conversation_complete: false
        };
      }
      
      // PHASE 2: Update operation (duration or name changes)
      if (crudIntent.operation === 'update') {
        console.log("🔧 CRUD: Update operation detected");
        console.log(`   Activity: "${crudIntent.activityName}"`);
        if (crudIntent.newDuration) console.log(`   New duration: ${crudIntent.newDuration} min`);
        if (crudIntent.newName) console.log(`   New name: "${crudIntent.newName}"`);
        
        try {
          const { updateActivity } = await import("../morning/update_activity");
          const result = await updateActivity({
            user_id,
            activity_identifier: crudIntent.activityName!,
            new_duration: crudIntent.newDuration,
            new_name: crudIntent.newName
          });
          
          const changesList = result.changes_made.join(' and ');
          const updateReply = `I've updated ${result.matched_original_name}: ${changesList}.`;
          
          console.log("✅ CRUD: Update successful");
          console.log(`   ${updateReply}`);
          
          await db.exec`
            INSERT INTO conversation_history 
              (user_id, conversation_type, user_message, emma_response, context)
            VALUES 
              (${user_id}, ${session_type}, ${user_message}, ${updateReply}, 
               ${JSON.stringify({ 
                 crud_operation: 'update', 
                 activity_updated: result.updated_activity,
                 changes: result.changes_made
               })})
          `;
          
          await db.exec`
            UPDATE conversation_sessions
            SET last_activity_at = NOW()
            WHERE id = ${session.id}
          `;
          
          return {
            emma_reply: updateReply,
            session_id: session.id,
            conversation_complete: false
          };
          
        } catch (error: any) {
          console.log("❌ CRUD: Update failed");
          console.log(`   Error: ${error.message}`);
          
          let errorReply: string;
          if (error.message.includes('not found')) {
            errorReply = `I couldn't find "${crudIntent.activityName}" in your morning routine. Would you like to add it instead?`;
          } else if (error.message.includes('No active morning routine')) {
            errorReply = `You don't have a morning routine set up yet. Want to start one together?`;
          } else {
            errorReply = `I had trouble updating that activity. ${error.message}`;
          }
          
          await db.exec`
            INSERT INTO conversation_history 
              (user_id, conversation_type, user_message, emma_response)
            VALUES (${user_id}, ${session_type}, ${user_message}, ${errorReply})
          `;
          
          await db.exec`
            UPDATE conversation_sessions
            SET last_activity_at = NOW()
            WHERE id = ${session.id}
          `;
          
          return {
            emma_reply: errorReply,
            session_id: session.id,
            conversation_complete: false
          };
        }
      }
      
      // PHASE "COMPLETE ALL": Mark entire routine complete
      if (crudIntent.operation === 'complete_all') {
        console.log("🔥 CRUD: Complete All operation detected");
        
        try {
          const { markAllComplete } = await import("../morning/mark_all_complete");
          const result = await markAllComplete({ user_id });
          
          let completeAllReply: string;
          
          if (result.all_were_already_complete) {
            completeAllReply = `You're already at 100% — everything in your morning routine is marked complete for today. Nicely done.`;
          } else {
            completeAllReply = `🔥 Love it. I've marked all ${result.newly_completed_count} remaining items in your morning routine as complete for today. You're at 100% for your routine.`;
          }
          
          console.log("✅ CRUD: Complete All successful");
          console.log(`   ${completeAllReply}`);
          
          await db.exec`
            INSERT INTO conversation_history 
              (user_id, conversation_type, user_message, emma_response, context)
            VALUES 
              (${user_id}, ${session_type}, ${user_message}, ${completeAllReply}, 
               ${JSON.stringify({ 
                 crud_operation: 'complete_all', 
                 newly_completed_count: result.newly_completed_count,
                 total_activities: result.total_activities,
                 all_were_already_complete: result.all_were_already_complete
               })})
          `;
          
          await db.exec`
            UPDATE conversation_sessions
            SET last_activity_at = NOW()
            WHERE id = ${session.id}
          `;
          
          return {
            emma_reply: completeAllReply,
            session_id: session.id,
            conversation_complete: true  // Close session when all activities complete
          };
          
        } catch (error: any) {
          console.log("❌ CRUD: Complete All failed");
          console.log(`   Error: ${error.message}`);
          
          let errorReply: string;
          if (error.message.includes('No active morning routine')) {
            errorReply = `You don't have a morning routine set up yet. Want to start one together?`;
          } else if (error.message.includes('no activities')) {
            errorReply = `Your routine doesn't have any activities yet. Let's add some!`;
          } else {
            errorReply = `I had trouble marking your routine as complete. ${error.message}`;
          }
          
          await db.exec`
            INSERT INTO conversation_history 
              (user_id, conversation_type, user_message, emma_response)
            VALUES (${user_id}, ${session_type}, ${user_message}, ${errorReply})
          `;
          
          await db.exec`
            UPDATE conversation_sessions
            SET last_activity_at = NOW()
            WHERE id = ${session.id}
          `;
          
          return {
            emma_reply: errorReply,
            session_id: session.id,
            conversation_complete: false
          };
        }
      }
      
      // PHASE "COMPLETE": Mark activity as done (with improved matching + clarification)
      if (crudIntent.operation === 'complete') {
        console.log("✅ CRUD: Complete operation detected");
        console.log(`   Activity: "${crudIntent.activityName}"`);
        
        // Import utilities
        const { findActivityMatches } = await import("../morning/activity_utils");
        const { listActivities } = await import("../morning/list_activities");
        const { markActivityComplete } = await import("../morning/mark_activity_complete");
        
        try {
          const routineResult = await listActivities({ user_id });
          const matchResult = findActivityMatches(crudIntent.activityName!, routineResult.activities);
          
          console.log(`   Match confidence: ${matchResult.confidence}`);
          console.log(`   Candidates: ${matchResult.allCandidates.length}`);
          
          // HIGH or MEDIUM confidence: Auto-complete
          if (matchResult.confidence === 'high' || matchResult.confidence === 'medium') {
            console.log(`   ✅ Auto-completing (${matchResult.confidence} confidence)`);
            
            const result = await markActivityComplete({
              user_id,
              activity_identifier: matchResult.bestMatch!.activity.name
            });
            
            let completeReply: string;
            if (result.already_complete) {
              completeReply = `You're on it! ${result.matched_activity_name} is already marked as complete for today. Keep going—you've got this.`;
            } else if (result.all_completed) {
              completeReply = `🎉 Amazing! You've completed ${result.matched_activity_name} and finished your entire morning routine (${result.total_activities}/${result.total_activities} activities). You're crushing it today!`;
            } else {
              const remaining = result.total_activities - result.activities_completed_today;
              completeReply = `Great job! I've marked ${result.matched_activity_name} as complete. ${remaining} more to go!`;
            }
            
            await db.exec`
              INSERT INTO conversation_history 
                (user_id, conversation_type, user_message, emma_response, context)
              VALUES 
                (${user_id}, ${session_type}, ${user_message}, ${completeReply}, 
                 ${JSON.stringify({ 
                   crud_operation: 'complete', 
                   activity_name: result.matched_activity_name,
                   activities_completed_today: result.activities_completed_today,
                   total_activities: result.total_activities,
                   all_completed: result.all_completed,
                   match_confidence: matchResult.confidence
                 })})
            `;
            
            await db.exec`
              UPDATE conversation_sessions
              SET last_activity_at = NOW()
              WHERE id = ${session.id}
            `;
            
            return {
              emma_reply: completeReply,
              session_id: session.id,
              conversation_complete: result.all_completed
            };
          }
          
          // AMBIGUOUS: Ask for clarification
          else if (matchResult.confidence === 'ambiguous') {
            console.log(`   🔍 Ambiguous match - asking for clarification`);
            
            const topCandidates = matchResult.allCandidates.slice(0, 3);
            const candidatesList = topCandidates
              .map((c, i) => `${i + 1}. ${c.activity.name}`)
              .join('\n');
            
            const clarificationReply = `Got it — you did your ${crudIntent.activityName}. Just to make sure I mark the right one, which did you mean?\n\n${candidatesList}\n\nYou can reply with the number or the activity name.`;
            
            // Store candidates in session context
            const clarificationContext = {
              pendingCompletion: {
                type: 'activity_completion_clarification',
                candidates: topCandidates.map(c => ({
                  index: c.index,
                  activityId: c.activity.id,
                  activityName: c.activity.name
                })),
                originalMessage: user_message,
                timestamp: Date.now()
              }
            };
            
            await db.exec`
              UPDATE conversation_sessions
              SET context = ${JSON.stringify(clarificationContext)}::jsonb,
                  last_activity_at = NOW()
              WHERE id = ${session.id}
            `;
            
            await db.exec`
              INSERT INTO conversation_history 
                (user_id, conversation_type, user_message, emma_response, context)
              VALUES 
                (${user_id}, ${session_type}, ${user_message}, ${clarificationReply}, 
                 ${JSON.stringify({ 
                   crud_operation: 'complete_clarification_needed', 
                   search_term: crudIntent.activityName,
                   candidates: topCandidates.map(c => c.activity.name)
                 })})
            `;
            
            return {
              emma_reply: clarificationReply,
              session_id: session.id,
              conversation_complete: false
            };
          }
          
          // LOW confidence or no match
          else {
            console.log(`   ❌ Low confidence / no match`);
            const errorReply = `I couldn't find "${crudIntent.activityName}" in your morning routine. What activity did you just complete?`;
            
            await db.exec`
              INSERT INTO conversation_history 
                (user_id, conversation_type, user_message, emma_response)
              VALUES (${user_id}, ${session_type}, ${user_message}, ${errorReply})
            `;
            
            await db.exec`
              UPDATE conversation_sessions
              SET last_activity_at = NOW()
              WHERE id = ${session.id}
            `;
            
            return {
              emma_reply: errorReply,
              session_id: session.id,
              conversation_complete: false
            };
          }
          
        } catch (error: any) {
          console.log("❌ CRUD: Complete failed");
          console.log(`   Error: ${error.message}`);
          
          let errorReply: string;
          if (error.message.includes('No active morning routine')) {
            errorReply = `You don't have a morning routine set up yet. Want to start one together?`;
          } else {
            errorReply = `I had trouble marking that activity as complete. ${error.message}`;
          }
          
          await db.exec`
            INSERT INTO conversation_history 
              (user_id, conversation_type, user_message, emma_response)
            VALUES (${user_id}, ${session_type}, ${user_message}, ${errorReply})
          `;
          
          await db.exec`
            UPDATE conversation_sessions
            SET last_activity_at = NOW()
            WHERE id = ${session.id}
          `;
          
          return {
            emma_reply: errorReply,
            session_id: session.id,
            conversation_complete: false
          };
        }
      }
    }

    const emmaReply = await callAI(conversationHistory);

    // DEBUG: Log Emma's raw reply to check for ADD_ROUTINE_ACTIVITY commands
    if (session_type === "morning") {
      console.log("\n🔍 DEBUG - Emma's raw reply:", emmaReply);
      console.log("📋 DEBUG - Checking for ADD_ROUTINE_ACTIVITY pattern...\n");
    }

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

    // UNIFIED WORKFLOW: Extract and process morning routine activities from natural conversation
    if (session_type === "morning") {
      // Strategy 1: Extract from Emma's confirmation (preferred)
      const activityName = extractActivityFromReply(emmaReply);
      
      if (activityName) {
        console.log(`\n🔍 EXTRACTOR (Emma): Detected activity addition: "${activityName}"`);
        
        const activity: MorningRoutineActivity = {
          id: `activity-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: activityName,
          duration_minutes: inferDuration(activityName),
          icon: inferIcon(activityName),
          description: ""
        };
        
        console.log(`🔍 EXTRACTOR (Emma): Inferred duration=${activity.duration_minutes}min, icon=${activity.icon}`);
        
        try {
          // Use unified workflow: auto-create routine if needed + journal logging + memory updates
          await processMorningRoutineActivity(user_id, activity, {
            userMessage: user_message,
            emmaReply: cleanedReply
          });
          
          activityAdded = true;
          console.log(`✅ EXTRACTOR (Emma): Activity "${activityName}" processed successfully\n`);
        } catch (error) {
          console.error("❌ EXTRACTOR (Emma): Failed to add routine activity:", error);
        }
      } else {
        console.log(`🔍 EXTRACTOR (Emma): No activity addition detected in Emma's reply`);
        
        // Strategy 2: Extract from user's description of existing routine (fallback)
        const userActivities = extractActivitiesFromUserDescription(user_message);
        
        if (userActivities.length > 0) {
          console.log(`\n🔍 EXTRACTOR (User): Detected ${userActivities.length} activity(ies) from user's message`);
          
          for (const userActivityName of userActivities) {
            console.log(`🔍 EXTRACTOR (User): Processing "${userActivityName}"`);
            
            const activity: MorningRoutineActivity = {
              id: `activity-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              name: userActivityName,
              duration_minutes: inferDuration(userActivityName),
              icon: inferIcon(userActivityName),
              description: ""
            };
            
            console.log(`🔍 EXTRACTOR (User): Inferred duration=${activity.duration_minutes}min, icon=${activity.icon}`);
            
            try {
              // Use unified workflow: auto-create routine if needed + journal logging + memory updates
              await processMorningRoutineActivity(user_id, activity, {
                userMessage: user_message,
                emmaReply: cleanedReply
              });
              
              activityAdded = true;
              console.log(`✅ EXTRACTOR (User): Activity "${userActivityName}" added from user description\n`);
            } catch (error) {
              console.error(`❌ EXTRACTOR (User): Failed to add "${userActivityName}":`, error);
            }
          }
        } else {
          console.log(`🔍 EXTRACTOR (User): No routine description detected in user's message`);
        }
      }
    }

    await db.exec`
      INSERT INTO conversation_history 
        (user_id, conversation_type, user_message, emma_response, context)
      VALUES 
        (${user_id}, ${session_type}, ${user_message}, ${emmaReply}, ${JSON.stringify(sessionContext)})
    `;

    // FIX 2: Removed old updateMorningPreferences function that used user_profiles.morning_routine_preferences
    // All morning routine data now flows through the unified workflow via processMorningRoutineActivity

    // Process wake time if mentioned (only for morning session)
    if (session_type === "morning") {
      const wakeTimeMatch = user_message.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
      if (wakeTimeMatch && emmaReply.toLowerCase().includes("wake")) {
        const hour = parseInt(wakeTimeMatch[1]);
        const minute = wakeTimeMatch[2] || "00";
        const period = wakeTimeMatch[3]?.toLowerCase();
        
        let formattedHour = hour;
        if (period === "pm" && hour !== 12) formattedHour += 12;
        if (period === "am" && hour === 12) formattedHour = 0;
        
        const wakeTime = `${String(formattedHour).padStart(2, "0")}:${minute}`;
        
        await updateWakeTime(user_id, wakeTime, {
          userMessage: user_message,
          emmaReply: cleanedReply
        });
      }
    }

    // Update Emma Memory (for general conversation insights)
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

    let detectedInsights: any[] = [];
    let autoAppliedInsights: any[] = [];
    
    try {
      const insightResponse = await detectIntents({
        sessionId: session.id,
        userId: user_id,
        userMessage: user_message,
        emmaResponse: cleanedReply
      });
      
      detectedInsights = insightResponse.insights || [];
      
      for (const insight of detectedInsights) {
        if (insight.confidence >= 0.75) {
          try {
            console.log('🚀 Auto-applying insight:', insight.intentType, 'confidence:', insight.confidence);
            
            await applySuggestion({
              suggestionId: insight.id,
              userId: user_id
            });
            
            autoAppliedInsights.push(insight);
            console.log('✅ Auto-applied successfully');
            
          } catch (error) {
            console.error('❌ Failed to auto-apply insight:', error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to detect intents:", error);
    }

    return {
      emma_reply: cleanedReply,
      session_id: session.id,
      conversation_complete: conversationComplete,
      journal_entry_created: !!journalEntryId,
      routine_activity_added: activityAdded,
      detected_insights: detectedInsights.filter(i => i.confidence < 0.75),
      auto_applied_insights: autoAppliedInsights
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

Morning Routine Activity Guidance (ONLY for morning session_type):
When ${userName} mentions wanting to add a morning activity, respond warmly and confirm that you've added it.

ACTIVITY CONFIRMATION - CRITICAL:
- ALWAYS confirm activity additions using phrases like: "I've added [activity] to your morning routine" or "I've added [activity] to your routine"
- This confirmation is essential - the system relies on you saying you've added something
- Be warm, encouraging, and natural in your confirmation
- Don't ask permission - just add it and confirm naturally
- The system prevents duplicates automatically

CONFIRMATION EXAMPLES:

User: "I want to add yoga to my morning routine"
You: "That's wonderful! I've added yoga to your morning routine. ✨ How long would you like to practice each morning?"

User: "I like to start my day with coffee"
You: "Perfect! I've added your morning coffee ritual to your routine. ☕ What's your favorite way to enjoy it?"

User: "Add meditation"
You: "I've added meditation to your routine! 🙏 Are you new to meditation or have you practiced before?"

User: "I do sit-ups every morning"
You: "That's great! I've added sit-ups to your morning routine. 💪 How many do you usually do?"

User: "Add a morning walk"
You: "I've added a morning walk to your routine! 🚶 Walking is such a peaceful way to start the day."

REMEMBER: Always use confirmation language like "I've added [activity] to your routine" - this is how the system knows to save it!
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

This is a morning check-in conversation using the UNIFIED WORKFLOW.

Your goals:
1. Ask about their sleep (naturally, not clinically)
2. Listen for morning activities they mention - automatically add them to their routine
3. Help them discover and establish healthy morning habits
4. Build their morning routine through natural conversation (no need to ask permission first)
5. Help them feel positive and supported
6. If they share gratitude or meaningful insights, suggest adding to wellness journal

AUTOMATIC ROUTINE BUILDING - NATURAL CONVERSATION:

User: "I want to add yoga to my morning routine"
You: "That's wonderful! I've added yoga to your morning routine. ✨ How does yoga make you feel?"

User: "I like to start with coffee"
You: "Perfect! I've added your morning coffee ritual to your routine. ☕ What's your favorite way to enjoy it?"

User: "Add meditation"
You: "I've added meditation to your routine! 🙏 Are you new to meditation or have you practiced before?"

REMEMBER: Always confirm with "I've added [activity] to your routine" - this exact phrasing is essential!

CONVERSATION FLOW:
1. Greet warmly based on time of day
2. Ask about their sleep
3. Listen for ANY activity mention and add it naturally
4. Use phrases like "I've added [activity] to your routine!" to confirm
5. Continue conversation naturally with follow-up questions

Important: Always say "I've added [activity] to your routine" when they mention activities - this is essential for the system to save them!`, 

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
