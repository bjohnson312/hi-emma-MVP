import db from "../db";
import type { CreateJournalEntryRequest, WellnessJournalEntry, SourceType } from "./types";
import { autoLinkEntryToChapter } from "./link_entry_to_chapter";

export async function createJournalEntry(req: CreateJournalEntryRequest): Promise<WellnessJournalEntry> {
  const {
    user_id,
    entry_date = new Date(),
    entry_type,
    title,
    content,
    mood_rating,
    energy_level,
    sleep_quality,
    tags,
    metadata,
    source_type,
    source_id,
    ai_generated = false
  } = req;

  const entry = await db.queryRow<WellnessJournalEntry>`
    INSERT INTO wellness_journal_entries (
      user_id,
      entry_date,
      entry_type,
      title,
      content,
      mood_rating,
      energy_level,
      sleep_quality,
      tags,
      metadata,
      source_type,
      source_id,
      ai_generated
    ) VALUES (
      ${user_id},
      ${entry_date},
      ${entry_type},
      ${title},
      ${content},
      ${mood_rating || null},
      ${energy_level || null},
      ${sleep_quality || null},
      ${tags || null},
      ${metadata ? JSON.stringify(metadata) : null},
      ${source_type || null},
      ${source_id || null},
      ${ai_generated}
    )
    RETURNING id, user_id, entry_date, entry_type, title, content, mood_rating,
              energy_level, sleep_quality, tags, metadata, source_type, source_id,
              ai_generated, chapter_id, section_id, created_at, updated_at
  `;

  if (entry && source_type) {
    await autoLinkEntryToChapter(user_id, entry.id, source_type);
  }

  return entry!;
}

export async function autoCreateMorningEntry(
  userId: string,
  sleepQuality: string,
  selectedAction: string,
  notes?: string,
  sourceId?: number
): Promise<void> {
  const content = `Sleep quality: ${sleepQuality}. ${
    selectedAction === "stretch" ? "Started the day with stretching." :
    selectedAction === "deep_breath" ? "Took some deep breaths to center myself." :
    selectedAction === "gratitude_moment" ? "Practiced gratitude this morning." :
    "Completed morning routine."
  }${notes ? ` ${notes}` : ""}`;

  await createJournalEntry({
    user_id: userId,
    entry_type: "event",
    title: "Morning Routine",
    content,
    sleep_quality: sleepQuality,
    tags: ["morning", "routine", selectedAction],
    source_type: "morning_routine",
    source_id: sourceId,
    ai_generated: false
  });
}

export async function autoCreateMorningRoutineEntry(
  userId: string,
  activitiesCompleted: string[],
  moodRating?: number,
  energyLevel?: number,
  notes?: string,
  sourceId?: number
): Promise<void> {
  const activityList = activitiesCompleted.length > 0 
    ? activitiesCompleted.join(", ") 
    : "morning activities";
  
  let content = `Completed morning routine: ${activityList}.`;
  
  if (moodRating) {
    content += ` Feeling ${getMoodDescription(moodRating)}.`;
  }
  if (energyLevel) {
    content += ` Energy level: ${energyLevel}/5.`;
  }
  if (notes) {
    content += ` ${notes}`;
  }

  await createJournalEntry({
    user_id: userId,
    entry_type: "event",
    title: "Morning Routine Completed",
    content,
    mood_rating: moodRating,
    energy_level: energyLevel,
    tags: ["morning", "routine", "completed"],
    source_type: "morning_routine",
    source_id: sourceId,
    ai_generated: false
  });
}

export async function autoCreateEveningEntry(
  userId: string,
  windDownActivities: string[],
  screenTime?: number,
  bedtime?: string,
  notes?: string,
  sourceId?: number
): Promise<void> {
  let content = `Evening wind-down: ${windDownActivities.join(", ")}.`;
  if (screenTime !== undefined) {
    content += ` Screen time: ${screenTime} minutes.`;
  }
  if (bedtime) {
    content += ` Bedtime: ${bedtime}.`;
  }
  if (notes) {
    content += ` ${notes}`;
  }

  await createJournalEntry({
    user_id: userId,
    entry_type: "event",
    title: "Evening Routine",
    content,
    tags: ["evening", "routine", ...windDownActivities],
    source_type: "evening_routine",
    source_id: sourceId,
    ai_generated: false
  });
}

export async function autoCreateMoodEntry(
  userId: string,
  moodRating: number,
  moodTags?: string[],
  energyLevel?: number,
  stressLevel?: number,
  notes?: string,
  triggers?: string,
  sourceId?: number
): Promise<void> {
  let content = `Mood check-in: feeling ${getMoodDescription(moodRating)}.`;
  
  if (moodTags && moodTags.length > 0) {
    content += ` Emotions: ${moodTags.join(", ")}.`;
  }
  if (energyLevel) {
    content += ` Energy level: ${energyLevel}/5.`;
  }
  if (stressLevel) {
    content += ` Stress level: ${stressLevel}/5.`;
  }
  if (triggers) {
    content += ` Triggers: ${triggers}.`;
  }
  if (notes) {
    content += ` ${notes}`;
  }

  await createJournalEntry({
    user_id: userId,
    entry_type: "event",
    title: "Mood Check-In",
    content,
    mood_rating: moodRating,
    energy_level: energyLevel,
    tags: ["mood", ...(moodTags || [])],
    metadata: { stress_level: stressLevel, triggers },
    source_type: "mood",
    source_id: sourceId,
    ai_generated: false
  });
}

export async function autoCreateNutritionEntry(
  userId: string,
  mealType: string,
  description: string,
  waterIntake?: number,
  energyLevel?: number,
  notes?: string,
  sourceId?: number
): Promise<void> {
  let content = `${capitalizeFirst(mealType)}: ${description}.`;
  
  if (waterIntake) {
    content += ` Water intake: ${waterIntake} oz.`;
  }
  if (energyLevel) {
    content += ` Energy after meal: ${energyLevel}/5.`;
  }
  if (notes) {
    content += ` ${notes}`;
  }

  await createJournalEntry({
    user_id: userId,
    entry_type: "event",
    title: `${capitalizeFirst(mealType)} Log`,
    content,
    energy_level: energyLevel,
    tags: ["nutrition", mealType],
    metadata: { water_intake_oz: waterIntake },
    source_type: "nutrition",
    source_id: sourceId,
    ai_generated: false
  });
}

export async function autoCreateMedicationEntry(
  userId: string,
  medicationName: string,
  dosage: string,
  sourceId?: number
): Promise<void> {
  const content = `Took ${medicationName} (${dosage}) as prescribed.`;

  await createJournalEntry({
    user_id: userId,
    entry_type: "event",
    title: "Medication Taken",
    content,
    tags: ["medication", "adherence"],
    metadata: { medication_name: medicationName, dosage },
    source_type: "medication",
    source_id: sourceId,
    ai_generated: false
  });
}

export async function autoCreateConversationInsight(
  userId: string,
  conversationType: string,
  insights: string,
  keywords: string[],
  sourceId?: number
): Promise<void> {
  await createJournalEntry({
    user_id: userId,
    entry_type: "insight",
    title: `${capitalizeFirst(conversationType)} Conversation Insights`,
    content: insights,
    tags: ["conversation", conversationType, ...keywords],
    source_type: "conversation",
    source_id: sourceId,
    ai_generated: true
  });
}

function getMoodDescription(rating: number): string {
  if (rating >= 9) return "excellent";
  if (rating >= 7) return "good";
  if (rating >= 5) return "okay";
  if (rating >= 3) return "not great";
  return "struggling";
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
