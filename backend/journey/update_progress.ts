import db from "../db";

export async function updateJourneyProgress(
  userId: string, 
  field: string, 
  value: boolean = true
): Promise<void> {
  const query = `
    INSERT INTO wellness_journey_setup (user_id, ${field})
    VALUES ($1, $2)
    ON CONFLICT (user_id) DO UPDATE 
    SET ${field} = $2, last_updated = NOW()
  `;

  await db.rawExec(query, userId, value);
}
