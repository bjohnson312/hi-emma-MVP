/**
 * Core business logic for routine management.
 * 
 * This module contains PURE FUNCTIONS (no I/O) for:
 * - Time-of-day classification
 * - Greeting generation
 * - Routine suggestion logic
 * - Edge case handling
 * 
 * All logic is deterministic and timezone-aware.
 * NO database calls, NO API calls, NO side effects.
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type SessionType = 'morning' | 'evening' | 'mood' | 'nutrition' | 'diet' | 'doctors_orders' | 'general';
export type RoutineType = 'morning' | 'evening';

/**
 * Determines time of day based on server timestamp and user timezone.
 * 
 * RULES:
 * - Morning: 5:00 AM - 11:59 AM
 * - Afternoon: 12:00 PM - 4:59 PM
 * - Evening: 5:00 PM - 9:59 PM
 * - Night: 10:00 PM - 4:59 AM
 * 
 * @param timestamp - Server timestamp (UTC)
 * @param timezone - User's timezone (e.g., "America/New_York")
 * @returns Time of day classification
 * 
 * @example
 * determineTimeOfDay(new Date("2025-11-17T12:00:00Z"), "America/New_York")
 * // Returns: "morning" (7 AM EST)
 */
export function determineTimeOfDay(timestamp: Date, timezone: string): TimeOfDay {
  try {
    // Convert UTC timestamp to user's timezone
    const userTimeString = timestamp.toLocaleString('en-US', { 
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const hour = parseInt(userTimeString.split(':')[0]);
    
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  } catch (error) {
    // Fallback: if timezone conversion fails, use UTC hour
    console.warn(`Failed to convert timezone ${timezone}, using UTC:`, error);
    const hour = timestamp.getUTCHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }
}

/**
 * Gets stable time of day for ongoing session.
 * 
 * EDGE CASE: User starts morning routine at 11:55 PM, continues past midnight.
 * Should not suddenly change greeting from "Good evening" to "Hi".
 * 
 * SOLUTION: Use session start time for classification, not current time.
 * 
 * @param sessionStartTime - When session started
 * @param currentTime - Current timestamp (unused, kept for future)
 * @param timezone - User's timezone
 * @returns Time of day based on session start
 */
export function getStableTimeOfDay(
  sessionStartTime: Date,
  currentTime: Date,
  timezone: string
): TimeOfDay {
  // Always use session start time for stability
  return determineTimeOfDay(sessionStartTime, timezone);
}

/**
 * Generates personalized greeting based on context.
 * 
 * @param params - Greeting parameters
 * @returns Personalized greeting string
 * 
 * @example
 * generateGreeting({
 *   userName: "Sarah",
 *   timeOfDay: "morning",
 *   sessionType: "morning",
 *   isFirstCheckIn: true
 * })
 * // Returns: "Good morning, Sarah! How did you sleep?"
 */
export function generateGreeting(params: {
  userName: string;
  timeOfDay: TimeOfDay;
  sessionType: SessionType;
  isFirstCheckIn: boolean;
  userContext?: {
    currentStreak?: number;
    lastCheckInDate?: string;
    recentMood?: number;
    preferredGreetingStyle?: 'formal' | 'casual';
  };
}): string {
  const { userName, timeOfDay, sessionType, isFirstCheckIn, userContext } = params;
  
  // Map time of day to greeting prefix
  const timeGreetings: Record<TimeOfDay, string> = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Hi',
  };
  
  const baseGreeting = timeGreetings[timeOfDay];
  
  // FIRST CHECK-IN: Session-specific prompts
  if (isFirstCheckIn) {
    const firstCheckInPrompts: Record<SessionType, string> = {
      morning: `${baseGreeting}, ${userName}! How did you sleep?`,
      evening: `${baseGreeting}, ${userName}! How was your day?`,
      mood: `${baseGreeting}, ${userName}! How are you feeling right now?`,
      nutrition: `${baseGreeting}, ${userName}! I'm here to help with your nutrition. What's on your mind?`,
      diet: `${baseGreeting}, ${userName}! What have you eaten today?`,
      doctors_orders: `${baseGreeting}, ${userName}! How are you feeling today?`,
      general: `${baseGreeting}, ${userName}! What's on your mind?`,
    };
    return firstCheckInPrompts[sessionType] || firstCheckInPrompts.general;
  }
  
  // RETURNING USER: Personalized greetings based on context
  
  // Streak celebration (7+ days)
  if (userContext?.currentStreak && userContext.currentStreak >= 7) {
    return `${baseGreeting}, ${userName}! 🔥 ${userContext.currentStreak}-day streak - you're on fire!`;
  }
  
  // Welcome back after absence
  if (userContext?.lastCheckInDate) {
    const daysSince = calculateDaysSince(userContext.lastCheckInDate);
    if (daysSince === 1) {
      return `Welcome back, ${userName}! Great to see you again!`;
    }
    if (daysSince > 7) {
      return `${baseGreeting}, ${userName}! It's been a while - how have you been?`;
    }
  }
  
  // Recent low mood - empathetic greeting
  if (userContext?.recentMood && userContext.recentMood <= 3) {
    return `${baseGreeting}, ${userName}. I'm here for you - how are you doing?`;
  }
  
  // Default resume greeting
  const resumeGreetings: Record<SessionType, string> = {
    morning: `Welcome back, ${userName}! How are you feeling?`,
    evening: `Welcome back, ${userName}! What can I help you with?`,
    mood: `Hi again, ${userName}. How are you feeling now?`,
    nutrition: `Welcome back, ${userName}! Let's talk about your nutrition.`,
    diet: `Welcome back, ${userName}! What can I help you with?`,
    doctors_orders: `Hi again, ${userName}! What can I help you with?`,
    general: `Welcome back, ${userName}! What can I help you with?`,
  };
  
  return resumeGreetings[sessionType] || resumeGreetings.general;
}

/**
 * Determines if user should be prompted to start a routine.
 * 
 * @param params - Routine suggestion parameters
 * @returns Suggestion result with priority and reason
 * 
 * @example
 * shouldSuggestRoutine({
 *   routineType: "morning",
 *   currentTime: new Date(),
 *   timezone: "America/New_York",
 *   userPreferences: { morningRoutineTime: "07:00" },
 *   completedToday: false
 * })
 * // Returns: { shouldSuggest: true, reason: "Perfect time...", priority: "high" }
 */
export function shouldSuggestRoutine(params: {
  routineType: RoutineType;
  currentTime: Date;
  timezone: string;
  userPreferences: {
    morningRoutineTime?: string;
    eveningRoutineTime?: string;
  };
  completedToday: boolean;
}): {
  shouldSuggest: boolean;
  reason: string;
  priority: 'high' | 'medium' | 'low';
} {
  const { routineType, currentTime, timezone, userPreferences, completedToday } = params;
  
  // Already completed today?
  if (completedToday) {
    return {
      shouldSuggest: false,
      reason: `You've already completed your ${routineType} routine today! Great job!`,
      priority: 'low',
    };
  }
  
  const timeOfDay = determineTimeOfDay(currentTime, timezone);
  const userTimeString = currentTime.toLocaleString('en-US', { 
    timeZone: timezone,
    hour12: false,
    hour: '2-digit'
  });
  const hour = parseInt(userTimeString.split(':')[0]);
  
  // MORNING ROUTINE LOGIC
  if (routineType === 'morning') {
    // Not morning? Don't suggest
    if (timeOfDay !== 'morning') {
      return {
        shouldSuggest: false,
        reason: `It's ${timeOfDay} - morning routines are best done in the morning.`,
        priority: 'low',
      };
    }
    
    // Get preferred time (default 7 AM)
    const preferredTime = userPreferences.morningRoutineTime || '07:00';
    const preferredHour = parseInt(preferredTime.split(':')[0]);
    
    const hourDiff = Math.abs(hour - preferredHour);
    
    // Within 1 hour of preferred time - HIGH priority
    if (hourDiff <= 1) {
      return {
        shouldSuggest: true,
        reason: `Perfect time for your morning routine!`,
        priority: 'high',
      };
    }
    
    // Within 3 hours - MEDIUM priority
    if (hourDiff <= 3) {
      return {
        shouldSuggest: true,
        reason: `Ready to start your morning routine?`,
        priority: 'medium',
      };
    }
    
    // Still morning but far from preferred time - LOW priority
    return {
      shouldSuggest: true,
      reason: `It's still morning - good time for your routine!`,
      priority: 'low',
    };
  }
  
  // EVENING ROUTINE LOGIC
  if (routineType === 'evening') {
    // Only suggest during evening or night
    if (timeOfDay !== 'evening' && timeOfDay !== 'night') {
      return {
        shouldSuggest: false,
        reason: `It's ${timeOfDay} - evening routines are best done in the evening.`,
        priority: 'low',
      };
    }
    
    // Get preferred time (default 8 PM / 20:00)
    const preferredTime = userPreferences.eveningRoutineTime || '20:00';
    const preferredHour = parseInt(preferredTime.split(':')[0]);
    
    const hourDiff = Math.abs(hour - preferredHour);
    
    // Within 1 hour of preferred time - HIGH priority
    if (hourDiff <= 1) {
      return {
        shouldSuggest: true,
        reason: `Perfect time to wind down with your evening routine!`,
        priority: 'high',
      };
    }
    
    // Within 3 hours or late night - MEDIUM priority
    if (hourDiff <= 3 || timeOfDay === 'night') {
      return {
        shouldSuggest: true,
        reason: `Ready for your evening routine?`,
        priority: 'medium',
      };
    }
    
    return {
      shouldSuggest: true,
      reason: `Good time to start winding down!`,
      priority: 'low',
    };
  }
  
  return { 
    shouldSuggest: false, 
    reason: 'Unknown routine type', 
    priority: 'low' 
  };
}

/**
 * Validates if it's appropriate to start a routine now.
 * 
 * EDGE CASE: User tries to start morning routine at 11 PM.
 * 
 * @param routineType - Type of routine
 * @param currentTime - Current timestamp
 * @param timezone - User's timezone
 * @returns Validation result
 */
export function validateRoutineStart(
  routineType: RoutineType,
  currentTime: Date,
  timezone: string
): {
  isValid: boolean;
  warning?: string;
} {
  const timeOfDay = determineTimeOfDay(currentTime, timezone);
  
  if (routineType === 'morning') {
    if (timeOfDay === 'night' || timeOfDay === 'evening') {
      return {
        isValid: true,
        warning: `It's ${timeOfDay}, but you can still do your morning routine if you'd like! Tomorrow morning might feel more natural.`,
      };
    }
  }
  
  if (routineType === 'evening') {
    if (timeOfDay === 'morning') {
      return {
        isValid: true,
        warning: `It's ${timeOfDay}, but you can still do your evening routine if you'd like! Evening time might feel more natural.`,
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Gets time-appropriate greeting for late-night edge case.
 * 
 * EDGE CASE: User wakes up at 2 AM (insomnia).
 * Should we say "Good morning" or acknowledge it's late night?
 * 
 * @param hour - Hour (0-23)
 * @param userName - User's name
 * @returns Appropriate greeting
 */
export function getGreetingForLateNight(hour: number, userName: string): string {
  if (hour >= 0 && hour < 5) {
    return `Hi ${userName}, it's quite late. Having trouble sleeping?`;
  }
  return `Good morning, ${userName}!`;
}

/**
 * Calculates days since a date string.
 * 
 * @param dateString - ISO date string (e.g., "2025-11-10")
 * @returns Number of days since that date
 */
function calculateDaysSince(dateString: string): number {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return 0;
  }
}

/**
 * Formats time of day for display.
 * 
 * @param timeOfDay - Time classification
 * @returns Human-readable string
 */
export function formatTimeOfDay(timeOfDay: TimeOfDay): string {
  const formats: Record<TimeOfDay, string> = {
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'late night',
  };
  return formats[timeOfDay];
}
