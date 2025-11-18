import { api } from "encore.dev/api";
import type { GreetingRequest, GreetingResponse } from "./types";
import db from "../db";
import { determineTimeOfDay, generateGreeting } from "../../api_v2/business/routine";

export const greeting = api(
  { method: "GET", path: "/api/v2/user/greeting", expose: true },
  async (req: GreetingRequest): Promise<GreetingResponse> => {
    const profileResult = await db.query<{
      user_id: string;
      name: string;
      timezone: string | null;
    }>(
      `SELECT user_id, name, timezone FROM user_profiles WHERE user_id = $1`,
      [req.userId]
    );

    let userName = "User";
    let timezone = "America/New_York";

    if (profileResult.length > 0) {
      userName = profileResult[0].name;
      timezone = profileResult[0].timezone || "America/New_York";
    } else {
      await db.query(
        `INSERT INTO user_profiles (user_id, name, timezone) VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO NOTHING`,
        [req.userId, userName, timezone]
      );
    }

    const currentTime = new Date();
    const timeOfDay = determineTimeOfDay(currentTime, timezone);

    const greetingText = generateGreeting({
      userName,
      timeOfDay,
      sessionType: "general",
      isFirstCheckIn: true,
    });

    return {
      greeting: greetingText,
      timeOfDay,
    };
  }
);
