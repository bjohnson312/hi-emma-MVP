import { api } from "encore.dev/api";
import db from "../db";
import type { CheckInRequest, CheckInResponse, SleepQuality, RoutinePreference } from "./types";
import { 
  getGreeting,
  getNamedGreeting,
  categorizeSleep,
  getSleepResponse, 
  getHabitSuggestion, 
  getHabitInvitation,
  getStretchGuidance,
  getRoutineQuestion,
  getGratitudeResponse,
  getMusicResponse,
  getWakeTimeQuestion,
  getScheduleConfirmation
} from "./responses";
import type { UserProfile } from "../profile/types";
import { autoCreateMorningEntry } from "../wellness_journal/auto_create";
import { trackInteraction, updateBehaviorPattern, checkAndAwardMilestones } from "../profile/personalization";

export const checkIn = api<CheckInRequest, CheckInResponse>(
  { expose: true, method: "POST", path: "/morning_routine" },
  async (req) => {
    const {  
      user_id, 
      user_name, 
      user_response, 
      step = "greeting", 
      sleep_quality,
      wants_stretch,
      routine_preference,
      music_genre,
      wake_up_time
    } = req;

    // Step 1: Initial greeting - check if user exists
    if (step === "greeting") {
      await trackInteraction(user_id);
      await checkAndAwardMilestones(user_id);

      const existingProfile = await db.queryRow<UserProfile>`
        SELECT id, user_id, name, created_at, updated_at, interaction_count, morning_routine_preferences
        FROM user_profiles
        WHERE user_id = ${user_id}
      `;

      if (existingProfile) {
        const recentConversation = await db.queryRow<{ emma_response: string, created_at: Date }>`
          SELECT emma_response, created_at
          FROM conversation_history
          WHERE user_id = ${user_id} AND conversation_type = 'morning'
          ORDER BY created_at DESC
          LIMIT 1
        `;

        let greeting = `Welcome back, ${existingProfile.name}! `;
        
        const interactionCount = existingProfile.interaction_count || 0;
        if (interactionCount === 7) {
          greeting = `🌟 ${existingProfile.name}, you've been consistent for a week! That's amazing! `;
        } else if (interactionCount === 30) {
          greeting = `🚀 ${existingProfile.name}, 30 days of wellness - you're on fire! `;
        }

        if (recentConversation) {
          const daysSinceLastChat = Math.floor((Date.now() - new Date(recentConversation.created_at).getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceLastChat === 0) {
            greeting += "How are you feeling now?";
          } else if (daysSinceLastChat === 1) {
            greeting += "It's great to see you again! How did you sleep last night?";
          } else if (daysSinceLastChat > 7) {
            greeting += `I've missed our chats! It's been ${daysSinceLastChat} days. How have you been? How did you sleep?`;
          } else {
            greeting += `It's been ${daysSinceLastChat} days! How have you been? How did you sleep last night?`;
          }
        } else {
          greeting += "How did you sleep last night?";
        }

        await db.exec`
          INSERT INTO conversation_history 
            (user_id, conversation_type, emma_response)
          VALUES 
            (${user_id}, 'morning', ${greeting})
        `;

        return {
          emma_reply: greeting,
          next_step: "sleep_question"
        };
      }

      const greeting = getGreeting(user_name);
      await db.exec`
        INSERT INTO conversation_history 
          (user_id, conversation_type, emma_response)
        VALUES 
          (${user_id}, 'morning', ${greeting})
      `;

      return {
        emma_reply: greeting,
        next_step: user_name ? "sleep_question" : "process_name"
      };
    }

    // Step 2: Process name and ask about sleep
    if (step === "process_name" && user_response) {
      await db.exec`
        INSERT INTO user_profiles (user_id, name)
        VALUES (${user_id}, ${user_response})
        ON CONFLICT (user_id) DO UPDATE SET name = ${user_response}, updated_at = NOW()
      `;

      const greeting = getNamedGreeting(user_response);
      await db.exec`
        INSERT INTO conversation_history 
          (user_id, conversation_type, user_message, emma_response)
        VALUES 
          (${user_id}, 'morning', ${user_response}, ${greeting})
      `;

      return {
        emma_reply: greeting,
        next_step: "sleep_question"
      };
    }

    // Step 3: Process sleep response (from text input)
    if (step === "process_response" && user_response) {
      const categorizedQuality = categorizeSleep(user_response);
      const sleepResponse = getSleepResponse(categorizedQuality);
      const habitAction = getHabitSuggestion(categorizedQuality);
      const habitInvitation = getHabitInvitation(habitAction);

      await updateBehaviorPattern(user_id, "sleep_quality", {
        typical_quality: categorizedQuality,
        last_quality: categorizedQuality,
        last_report: user_response
      });

      const emmaReply = `${sleepResponse} ${habitInvitation}`;
      await db.exec`
        INSERT INTO conversation_history 
          (user_id, conversation_type, user_message, emma_response, context)
        VALUES 
          (${user_id}, 'morning', ${user_response}, ${emmaReply}, ${JSON.stringify({ sleep_quality: categorizedQuality, habit_action: habitAction })})
      `;

      // For now, only handle stretch action with the new flow
      if (habitAction === "stretch") {
        return {
          emma_reply: emmaReply,
          habit_suggestion: habitAction,
          next_step: "offer_stretch",
          show_yes_no: true
        };
      }

      // Fallback for other actions (deep_breath, gratitude_moment)
      await db.exec`
        INSERT INTO morning_routine_logs 
          (user_id, sleep_quality, selected_action, notes)
        VALUES 
          (${user_id}, ${categorizedQuality}, ${habitAction}, ${user_response})
      `;

      await autoCreateMorningEntry(user_id, categorizedQuality, habitAction, user_response);

      return {
        emma_reply: emmaReply,
        habit_suggestion: habitAction,
        next_step: "complete"
      };
    }

    // Step 4: User responds to stretch offer
    if (step === "offer_stretch") {
      if (wants_stretch) {
        const guidance = getStretchGuidance();
        await db.exec`
          INSERT INTO conversation_history 
            (user_id, conversation_type, user_message, emma_response)
          VALUES 
            (${user_id}, 'morning', 'yes', ${guidance.message})
        `;
        return {
          emma_reply: guidance.message,
          stretch_suggestions: guidance.suggestions,
          next_step: "guide_stretch"
        };
      } else {
        const reply = "No problem! Let's move on. " + getRoutineQuestion();
        await db.exec`
          INSERT INTO conversation_history 
            (user_id, conversation_type, user_message, emma_response)
          VALUES 
            (${user_id}, 'morning', 'no', ${reply})
        `;
        return {
          emma_reply: reply,
          next_step: "routine_preference",
          show_routine_options: true
        };
      }
    }

    // Step 5: After showing stretch suggestions, ask about routine
    if (step === "guide_stretch") {
      const question = getRoutineQuestion();
      await db.exec`
        INSERT INTO conversation_history 
          (user_id, conversation_type, emma_response)
        VALUES 
          (${user_id}, 'morning', ${question})
      `;
      return {
        emma_reply: question,
        next_step: "routine_preference",
        show_routine_options: true
      };
    }

    // Step 6: Process routine preference
    if (step === "routine_preference") {
      let responseMessage = "";
      let userMsg = "";
      
      if (routine_preference === "gratitude") {
        responseMessage = getGratitudeResponse();
        userMsg = "gratitude";
        await updateBehaviorPattern(user_id, "morning_activity", { preferred_activity: "gratitude" });
      } else if (routine_preference === "music") {
        responseMessage = getMusicResponse(music_genre);
        userMsg = music_genre ? `music - ${music_genre}` : "music";
        await updateBehaviorPattern(user_id, "morning_activity", { 
          preferred_activity: "music",
          preferred_genre: music_genre 
        });
      } else if (user_response) {
        responseMessage = getMusicResponse(user_response);
        userMsg = `music - ${user_response}`;
        await updateBehaviorPattern(user_id, "morning_activity", { 
          preferred_activity: "music",
          preferred_genre: user_response 
        });
      }

      const fullReply = `${responseMessage} ${getWakeTimeQuestion()}`;
      await db.exec`
        INSERT INTO conversation_history 
          (user_id, conversation_type, user_message, emma_response, context)
        VALUES 
          (${user_id}, 'morning', ${userMsg}, ${fullReply}, ${JSON.stringify({ routine_preference, music_genre })})
      `;

      return {
        emma_reply: fullReply,
        next_step: "wake_time"
      };
    }

    // Step 7: Process wake-up time and complete
    if (step === "wake_time" && wake_up_time) {
      const confirmation = getScheduleConfirmation(wake_up_time);
      
      await updateBehaviorPattern(user_id, "wake_time", { 
        preferred_wake_time: wake_up_time,
        last_reported_wake_time: wake_up_time
      });

      await db.exec`
        UPDATE user_profiles
        SET wake_time = ${wake_up_time}, updated_at = NOW()
        WHERE user_id = ${user_id}
      `;
      
      const result = await db.queryRow<{ id: number }>`
        INSERT INTO morning_routine_logs 
          (user_id, sleep_quality, selected_action, notes)
        VALUES 
          (${user_id}, 'good', 'stretch', ${JSON.stringify({
            routine_preference,
            music_genre,
            wake_up_time,
            user_name
          })})
        RETURNING id
      `;

      await autoCreateMorningEntry(
        user_id, 
        'good', 
        routine_preference || 'stretch', 
        `Morning preferences: ${routine_preference || 'stretching'}${music_genre ? `, ${music_genre} music` : ''}, wake time: ${wake_up_time}`,
        result?.id
      );

      await db.exec`
        INSERT INTO conversation_history 
          (user_id, conversation_type, user_message, emma_response, context)
        VALUES 
          (${user_id}, 'morning', ${wake_up_time}, ${confirmation}, ${JSON.stringify({ wake_up_time })})
      `;

      return {
        emma_reply: confirmation,
        next_step: "complete"
      };
    }

    return {
      emma_reply: "Hi, Emma here, your friendly wellness companion. What's your name?"
    };
  }
);
