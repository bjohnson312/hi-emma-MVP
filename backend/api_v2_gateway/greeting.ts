import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import type { GreetingRequest, GreetingResponse } from "./types";
import db from "../db";
import { determineTimeOfDay, generateGreeting } from "../../api_v2/business/routine";

export const greeting = api(
  { method: "GET", path: "/api/v2/user/greeting", expose: true },
  async (req: GreetingRequest): Promise<GreetingResponse> => {
    const auth = getAuthData();
    if (!auth || auth.userID !== req.userId) {
      throw APIError.permissionDenied("Cannot access or modify another user's data");
    }
    
    const profileResult = await db.queryAll<{
      user_id: string;
      name: string;
      timezone: string | null;
    }>`SELECT user_id, name, timezone FROM user_profiles WHERE user_id = ${req.userId}`;

    let userName = "User";
    let timezone = "America/New_York";

    if (profileResult.length > 0) {
      userName = profileResult[0].name;
      timezone = profileResult[0].timezone || "America/New_York";
    } else {
      await db.exec`INSERT INTO user_profiles (user_id, name, timezone) VALUES (${req.userId}, ${userName}, ${timezone})
         ON CONFLICT (user_id) DO NOTHING`;
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
