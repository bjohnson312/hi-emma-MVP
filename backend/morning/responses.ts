import type { SleepQuality, HabitAction } from "./types";

export function getGreeting(userName?: string): string {
  if (userName) {
    return `Hi, ${userName}! Emma here, your friendly wellness companion. How did you sleep last night?`;
  }
  return "Hi, Emma here, your friendly wellness companion. What's your name?";
}

export function getNamedGreeting(userName: string): string {
  return `Nice to meet you, ${userName}! How did you sleep last night?`;
}

export function categorizeSleep(userInput: string): SleepQuality {
  const input = userInput.toLowerCase();
  
  // Good sleep indicators
  const goodKeywords = [
    "great", "good", "well", "excellent", "amazing", "wonderful", "fantastic",
    "solid", "soundly", "peacefully", "deeply", "refreshed", "rested",
    "8 hours", "9 hours", "10 hours", "like a baby"
  ];
  
  // Poor sleep indicators
  const poorKeywords = [
    "bad", "poor", "terrible", "awful", "horrible", "rough", "restless",
    "tossed", "turned", "nightmare", "insomnia", "couldn't sleep",
    "didn't sleep", "barely", "hardly", "no sleep", "awful", "woke up",
    "interrupted", "3 hours", "4 hours", "few hours"
  ];
  
  // Check for good sleep
  if (goodKeywords.some(keyword => input.includes(keyword))) {
    return "good";
  }
  
  // Check for poor sleep
  if (poorKeywords.some(keyword => input.includes(keyword))) {
    return "poor";
  }
  
  // Default to okay
  return "okay";
}

export function getSleepResponse(quality: SleepQuality): string {
  const responses: Record<SleepQuality, string[]> = {
    good: [
      "That's wonderful! Starting the day well-rested is such a gift.",
      "I'm so glad to hear that! A good night's sleep sets the tone.",
      "Beautiful! Sounds like you're ready to take on the day."
    ],
    okay: [
      "I hear you. Some sleep is better than none!",
      "Thanks for sharing. Let's make the most of this morning.",
      "I appreciate your honesty. We'll ease into the day together."
    ],
    poor: [
      "I'm sorry you didn't rest well. Let's start gently today.",
      "That's tough. I'm here to help you ease into the morning.",
      "Sorry to hear that. Let's take it one step at a time."
    ]
  };

  const options = responses[quality];
  return options[Math.floor(Math.random() * options.length)];
}

export function getHabitSuggestion(quality: SleepQuality): HabitAction {
  // Always suggest stretching for morning routine
  return "stretch";
}

export function getHabitInvitation(action: HabitAction): string {
  const invitations: Record<HabitAction, string> = {
    stretch: "A morning stretch is a great way to get your day started. Do you have a moment for me to guide you through some gentle stretches?",
    deep_breath: "Let's take a deep breath together.",
    gratitude_moment: "Want to share something you're grateful for?"
  };

  return invitations[action];
}

export function getStretchGuidance(): { message: string; suggestions: string[] } {
  return {
    message: "Great! Take a moment to gently stretch your body and wake up your muscles. Here are some gentle stretches to try:",
    suggestions: [
      "Neck rolls: Slowly roll your head in circles, 3 times each direction",
      "Shoulder shrugs: Lift shoulders up to ears, hold for 3 seconds, then release",
      "Side stretches: Reach one arm overhead and lean gently to the side, hold for 10 seconds each side",
      "Cat-cow stretch: On hands and knees, alternate between arching and rounding your back",
      "Gentle twists: Sit cross-legged, place one hand behind you and gently twist, hold for 10 seconds each side"
    ]
  };
}

export function getRoutineQuestion(): string {
  return "I'd love to help you build a personalized morning routine! Would you like to add gratitude statements or music suggestions to wake up to?";
}

export function getGratitudeResponse(): string {
  return "Wonderful! Starting your day with gratitude is a beautiful practice. I'll include daily gratitude prompts in your morning routine.";
}

export function getMusicResponse(genre?: string): string {
  if (genre) {
    return `Great choice! I'll suggest ${genre} music to help you wake up peacefully. Music can really set the tone for your day.`;
  }
  return "Perfect! I'll include uplifting music suggestions to help you wake up peacefully. Music can really set the tone for your day.";
}

export function getWakeTimeQuestion(): string {
  return "What time do you normally wake up? I'd love to help you tomorrow at your wake-up time and guide you through your new morning routine!";
}

export function getScheduleConfirmation(wakeTime: string): string {
  return `Perfect! I'll be here tomorrow at ${wakeTime} to help you start your day with your personalized routine. Sleep well tonight!`;
}
