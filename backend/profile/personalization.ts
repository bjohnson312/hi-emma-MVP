import db from "../db";
import type { BehaviorPattern, UserInsight, UserMilestone } from "./types";

export async function trackInteraction(userId: string): Promise<void> {
  await db.exec`
    UPDATE user_profiles
    SET 
      interaction_count = COALESCE(interaction_count, 0) + 1,
      last_interaction_at = NOW()
    WHERE user_id = ${userId}
  `;
}

export async function updateBehaviorPattern(
  userId: string,
  patternType: string,
  patternData: Record<string, any>,
  confidenceScore?: number
): Promise<void> {
  await db.exec`
    INSERT INTO user_behavior_patterns 
      (user_id, pattern_type, pattern_data, confidence_score, first_observed, last_observed, observation_count)
    VALUES (${userId}, ${patternType}, ${JSON.stringify(patternData)}, ${confidenceScore || 0.5}, NOW(), NOW(), 1)
    ON CONFLICT (user_id, pattern_type)
    DO UPDATE SET
      pattern_data = EXCLUDED.pattern_data,
      confidence_score = CASE 
        WHEN EXCLUDED.confidence_score IS NOT NULL THEN EXCLUDED.confidence_score
        ELSE LEAST(user_behavior_patterns.confidence_score + 0.05, 1.0)
      END,
      last_observed = NOW(),
      observation_count = user_behavior_patterns.observation_count + 1,
      updated_at = NOW()
  `;
}

export async function getBehaviorPatterns(userId: string): Promise<BehaviorPattern[]> {
  const rowsQuery = await db.query`
    SELECT * FROM user_behavior_patterns
    WHERE user_id = ${userId}
    ORDER BY confidence_score DESC, last_observed DESC
  `;
  const rows = [];
  for await (const row of rowsQuery) {
    rows.push(row);
  }

  return rows.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    pattern_type: row.pattern_type,
    pattern_data: row.pattern_data,
    confidence_score: parseFloat(row.confidence_score),
    first_observed: row.first_observed,
    last_observed: row.last_observed,
    observation_count: row.observation_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function createInsight(
  userId: string,
  insightType: string,
  category: string,
  title: string,
  description: string,
  recommendations: string[] = [],
  dataPoints: Record<string, any> = {}
): Promise<number> {
  const row = await db.queryRow`
    INSERT INTO user_insights 
      (user_id, insight_type, insight_category, title, description, recommendations, data_points)
    VALUES (${userId}, ${insightType}, ${category}, ${title}, ${description}, ${JSON.stringify(recommendations)}, ${JSON.stringify(dataPoints)})
    RETURNING id
  `;

  return row!.id;
}

export async function createMilestone(
  userId: string,
  milestoneType: string,
  title: string,
  description?: string,
  metadata: Record<string, any> = {}
): Promise<number> {
  const row = await db.queryRow`
    INSERT INTO user_milestones 
      (user_id, milestone_type, title, description, metadata)
    VALUES (${userId}, ${milestoneType}, ${title}, ${description}, ${JSON.stringify(metadata)})
    RETURNING id
  `;

  return row!.id;
}

export async function checkAndAwardMilestones(userId: string): Promise<void> {
  const profile = await db.queryRow`
    SELECT interaction_count FROM user_profiles WHERE user_id = ${userId}
  `;

  if (!profile) return;

  const interactionCount = profile.interaction_count || 0;

  const milestoneCounts = [1, 7, 30, 100, 365];
  for (const count of milestoneCounts) {
    if (interactionCount === count) {
      const existing = await db.queryRow`
        SELECT id FROM user_milestones 
         WHERE user_id = ${userId} AND milestone_type = 'interaction_count' AND metadata->>'count' = ${count.toString()}
      `;

      if (!existing) {
        const titles: Record<number, string> = {
          1: "🎉 Welcome to Your Wellness Journey!",
          7: "🌟 One Week Strong!",
          30: "🚀 30-Day Wellness Streak!",
          100: "💫 Century Club!",
          365: "👑 Full Year Champion!",
        };

        await createMilestone(
          userId,
          "interaction_count",
          titles[count],
          `You've completed ${count} check-ins with Emma!`,
          { count }
        );
      }
    }
  }
}
