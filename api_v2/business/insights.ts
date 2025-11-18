/**
 * Core business logic for intent detection and entity extraction.
 * 
 * This module contains PURE FUNCTIONS (no I/O) for:
 * - Detecting user intent from messages
 * - Extracting entities (times, activities, foods, etc.)
 * - Prioritizing detected intents
 * - Confidence scoring
 * 
 * All logic is deterministic and rule-based (no AI calls).
 * Can be extended with ML models in the future.
 */

export type IntentType =
  | 'start_morning_routine'
  | 'start_evening_routine'
  | 'log_mood'
  | 'track_meal'
  | 'track_medication'
  | 'add_journal_entry'
  | 'ask_question'
  | 'general_conversation';

export interface DetectedIntent {
  intent: IntentType;
  confidence: number; // 0.0 - 1.0
  entities: Record<string, any>;
  originalMessage: string;
}

/**
 * Detects primary intent from user message.
 * 
 * APPROACH: Rule-based keyword matching with confidence scoring.
 * Future: Can be replaced with ML classifier.
 * 
 * @param message - User's message
 * @returns Detected intent with confidence and entities
 * 
 * @example
 * detectIntentFromMessage("I want to start my morning routine")
 * // Returns: {
 * //   intent: "start_morning_routine",
 * //   confidence: 0.95,
 * //   entities: { routineType: "morning" }
 * // }
 */
export function detectIntentFromMessage(message: string): DetectedIntent {
  const lowerMessage = message.toLowerCase().trim();
  
  // Pattern matching for each intent type
  const intentPatterns: Array<{
    intent: IntentType;
    patterns: RegExp[];
    confidence: number;
    entityExtractor?: (message: string) => Record<string, any>;
  }> = [
    // START MORNING ROUTINE
    {
      intent: 'start_morning_routine',
      patterns: [
        /\b(start|begin|do|ready for)\s+(my\s+)?morning\s+routine\b/i,
        /\bmorning\s+routine\b/i,
        /\b(let's|lets)\s+(start|begin)\s+(the\s+)?morning\b/i,
      ],
      confidence: 0.95,
      entityExtractor: () => ({ routineType: 'morning' }),
    },
    
    // START EVENING ROUTINE
    {
      intent: 'start_evening_routine',
      patterns: [
        /\b(start|begin|do|ready for)\s+(my\s+)?evening\s+routine\b/i,
        /\bevening\s+routine\b/i,
        /\b(wind|winding)\s+down\b/i,
        /\bnight\s+routine\b/i,
      ],
      confidence: 0.95,
      entityExtractor: () => ({ routineType: 'evening' }),
    },
    
    // LOG MOOD
    {
      intent: 'log_mood',
      patterns: [
        /\b(i\s+feel|i'm\s+feeling|feeling)\s+(really\s+)?(sad|happy|anxious|stressed|great|terrible|okay|fine|good|bad)\b/i,
        /\b(log|track|record)\s+(my\s+)?mood\b/i,
        /\bhow\s+(i'm|i am)\s+feeling\b/i,
      ],
      confidence: 0.85,
      entityExtractor: (msg) => extractMoodEntities(msg),
    },
    
    // TRACK MEAL
    {
      intent: 'track_meal',
      patterns: [
        /\b(i\s+ate|i\s+had|i\s+just\s+ate)\s+/i,
        /\b(log|track|record)\s+(my\s+)?(meal|food|breakfast|lunch|dinner)\b/i,
        /\bfor\s+(breakfast|lunch|dinner|snack)\s+i\s+(ate|had)\b/i,
      ],
      confidence: 0.90,
      entityExtractor: (msg) => extractMealEntities(msg),
    },
    
    // TRACK MEDICATION
    {
      intent: 'track_medication',
      patterns: [
        /\b(took|take|taking)\s+(my\s+)?(medication|meds|medicine|pill)\b/i,
        /\b(log|track|record)\s+(my\s+)?(medication|meds)\b/i,
      ],
      confidence: 0.90,
      entityExtractor: (msg) => extractMedicationEntities(msg),
    },
    
    // ADD JOURNAL ENTRY (explicit request)
    {
      intent: 'add_journal_entry',
      patterns: [
        /\b(add|write|save|record)\s+(to|in)\s+(my\s+)?journal\b/i,
        /\bjournal\s+(this|that)\b/i,
      ],
      confidence: 0.95,
    },
    
    // ASK QUESTION
    {
      intent: 'ask_question',
      patterns: [
        /^(what|when|where|who|why|how|can|could|would|should|is|are|do|does)\s+/i,
        /\?$/,
      ],
      confidence: 0.70,
    },
  ];
  
  // Find matching intent
  for (const { intent, patterns, confidence, entityExtractor } of intentPatterns) {
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        return {
          intent,
          confidence,
          entities: entityExtractor ? entityExtractor(lowerMessage) : {},
          originalMessage: message,
        };
      }
    }
  }
  
  // Default: general conversation
  return {
    intent: 'general_conversation',
    confidence: 1.0,
    entities: {},
    originalMessage: message,
  };
}

/**
 * Extracts mood-related entities from message.
 * 
 * @param message - User message
 * @returns Extracted entities
 */
function extractMoodEntities(message: string): Record<string, any> {
  const lowerMessage = message.toLowerCase();
  
  // Mood keywords and scores
  const moodMap: Record<string, number> = {
    terrible: 1,
    awful: 1,
    horrible: 2,
    sad: 3,
    down: 3,
    anxious: 4,
    stressed: 4,
    okay: 5,
    fine: 5,
    alright: 6,
    good: 7,
    happy: 8,
    great: 9,
    amazing: 10,
    fantastic: 10,
  };
  
  // Find mood keywords
  for (const [keyword, score] of Object.entries(moodMap)) {
    if (lowerMessage.includes(keyword)) {
      return {
        detectedMood: keyword,
        estimatedScore: score,
      };
    }
  }
  
  return {};
}

/**
 * Extracts meal-related entities from message.
 * 
 * @param message - User message
 * @returns Extracted entities
 */
function extractMealEntities(message: string): Record<string, any> {
  const lowerMessage = message.toLowerCase();
  
  // Meal type
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  let mealType = 'snack'; // default
  
  for (const type of mealTypes) {
    if (lowerMessage.includes(type)) {
      mealType = type;
      break;
    }
  }
  
  // Extract foods (simple: anything after "ate" or "had")
  const foodMatch = lowerMessage.match(/\b(ate|had)\s+(.+?)(\.|,|$)/);
  const foods = foodMatch ? foodMatch[2].trim() : undefined;
  
  return {
    mealType,
    foods,
  };
}

/**
 * Extracts medication-related entities from message.
 * 
 * @param message - User message
 * @returns Extracted entities
 */
function extractMedicationEntities(message: string): Record<string, any> {
  const lowerMessage = message.toLowerCase();
  
  // Time indicators
  const timeIndicators = {
    morning: /\b(morning|am|breakfast)\b/,
    afternoon: /\b(afternoon|lunch)\b/,
    evening: /\b(evening|night|pm|dinner)\b/,
  };
  
  let timeOfDay = 'general';
  for (const [time, pattern] of Object.entries(timeIndicators)) {
    if (pattern.test(lowerMessage)) {
      timeOfDay = time;
      break;
    }
  }
  
  return {
    timeOfDay,
  };
}

/**
 * Prioritizes multiple detected intents.
 * 
 * When a message could match multiple intents, this determines
 * which one to act on first.
 * 
 * @param intents - Array of detected intents
 * @returns Sorted array (highest priority first)
 */
export function prioritizeIntents(intents: DetectedIntent[]): DetectedIntent[] {
  // Priority order (higher number = higher priority)
  const intentPriority: Record<IntentType, number> = {
    start_morning_routine: 10,
    start_evening_routine: 10,
    track_medication: 9,
    log_mood: 8,
    track_meal: 7,
    add_journal_entry: 6,
    ask_question: 3,
    general_conversation: 1,
  };
  
  return intents.sort((a, b) => {
    // First, sort by priority
    const priorityDiff = intentPriority[b.intent] - intentPriority[a.intent];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by confidence
    return b.confidence - a.confidence;
  });
}

/**
 * Checks if intent should trigger immediate action vs. conversation.
 * 
 * RULE: High-confidence actionable intents (routines, tracking) should
 * trigger actions. Low-confidence or conversational intents should just talk.
 * 
 * @param intent - Detected intent
 * @param threshold - Confidence threshold for action (default 0.80)
 * @returns Whether to trigger action
 */
export function shouldTriggerAction(
  intent: DetectedIntent,
  threshold: number = 0.80
): boolean {
  // Actionable intents (not questions or general conversation)
  const actionableIntents: IntentType[] = [
    'start_morning_routine',
    'start_evening_routine',
    'log_mood',
    'track_meal',
    'track_medication',
    'add_journal_entry',
  ];
  
  return (
    actionableIntents.includes(intent.intent) &&
    intent.confidence >= threshold
  );
}

/**
 * Generates suggested action from detected intent.
 * 
 * Maps intent to frontend-actionable structure.
 * 
 * @param intent - Detected intent
 * @returns Suggested action object
 */
export function generateSuggestedAction(intent: DetectedIntent): {
  id: string;
  label: string;
  action: string;
  params: Record<string, any>;
} | null {
  switch (intent.intent) {
    case 'start_morning_routine':
      return {
        id: 'start_morning_routine',
        label: 'Start Morning Routine',
        action: 'start_routine',
        params: { type: 'morning' },
      };
    
    case 'start_evening_routine':
      return {
        id: 'start_evening_routine',
        label: 'Start Evening Routine',
        action: 'start_routine',
        params: { type: 'evening' },
      };
    
    case 'log_mood':
      return {
        id: 'log_mood',
        label: 'Log Your Mood',
        action: 'log_mood',
        params: intent.entities,
      };
    
    case 'track_meal':
      return {
        id: 'track_meal',
        label: 'Track Meal',
        action: 'track_meal',
        params: intent.entities,
      };
    
    case 'track_medication':
      return {
        id: 'track_medication',
        label: 'Log Medication',
        action: 'track_medication',
        params: intent.entities,
      };
    
    case 'add_journal_entry':
      return {
        id: 'add_journal_entry',
        label: 'Add to Journal',
        action: 'add_journal',
        params: {},
      };
    
    default:
      return null;
  }
}

/**
 * Validates if detected intent makes sense given current context.
 * 
 * EXAMPLE: User says "start morning routine" at 11 PM.
 * Intent is correctly detected, but context suggests warning.
 * 
 * @param intent - Detected intent
 * @param context - Current context (time of day, etc.)
 * @returns Validation result
 */
export function validateIntentContext(
  intent: DetectedIntent,
  context: {
    timeOfDay?: string;
    activeRoutine?: string;
  }
): {
  isValid: boolean;
  warning?: string;
} {
  // Morning routine at night?
  if (intent.intent === 'start_morning_routine') {
    if (context.timeOfDay === 'night' || context.timeOfDay === 'evening') {
      return {
        isValid: true,
        warning: `It's ${context.timeOfDay}, but you can still do your morning routine if you'd like!`,
      };
    }
  }
  
  // Evening routine in morning?
  if (intent.intent === 'start_evening_routine') {
    if (context.timeOfDay === 'morning') {
      return {
        isValid: true,
        warning: `It's ${context.timeOfDay}, but you can still do your evening routine if you'd like!`,
      };
    }
  }
  
  // Already in a routine?
  if (
    (intent.intent === 'start_morning_routine' || intent.intent === 'start_evening_routine') &&
    context.activeRoutine
  ) {
    return {
      isValid: false,
      warning: `You're currently in your ${context.activeRoutine} routine. Finish that first!`,
    };
  }
  
  return { isValid: true };
}
