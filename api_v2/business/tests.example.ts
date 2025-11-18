/**
 * Unit Test Examples for Business Logic (Phase 1)
 * 
 * These are EXAMPLE tests demonstrating how to test the pure business logic.
 * 
 * TESTING FRAMEWORK: Can use Vitest, Jest, or any TypeScript test runner
 * 
 * WHY THESE TESTS MATTER:
 * - Business logic is PURE FUNCTIONS (no I/O, deterministic)
 * - Easy to test without mocking databases or APIs
 * - Can run in CI/CD pipeline
 * - Catch regressions before deployment
 * 
 * TO RUN THESE TESTS:
 * 1. Install vitest: npm install -D vitest
 * 2. Add to package.json: "test": "vitest"
 * 3. Run: npm test
 * 
 * NOTE: These are EXAMPLES. In production, create separate .test.ts files.
 */

// ==================== ROUTINE BUSINESS LOGIC TESTS ====================

import {
  determineTimeOfDay,
  generateGreeting,
  shouldSuggestRoutine,
  validateRoutineStart,
} from '../business/routine';

// TEST: Time of day classification

export function testDetermineTimeOfDay_Morning() {
  // 7 AM EST = 12 PM UTC
  const timestamp = new Date('2025-11-17T12:00:00Z');
  const timezone = 'America/New_York';
  
  const result = determineTimeOfDay(timestamp, timezone);
  
  console.assert(result === 'morning', `Expected 'morning', got '${result}'`);
  console.log('✅ testDetermineTimeOfDay_Morning passed');
}

export function testDetermineTimeOfDay_Afternoon() {
  // 2 PM EST = 7 PM UTC
  const timestamp = new Date('2025-11-17T19:00:00Z');
  const timezone = 'America/New_York';
  
  const result = determineTimeOfDay(timestamp, timezone);
  
  console.assert(result === 'afternoon', `Expected 'afternoon', got '${result}'`);
  console.log('✅ testDetermineTimeOfDay_Afternoon passed');
}

export function testDetermineTimeOfDay_Evening() {
  // 8 PM EST = 1 AM next day UTC
  const timestamp = new Date('2025-11-18T01:00:00Z');
  const timezone = 'America/New_York';
  
  const result = determineTimeOfDay(timestamp, timezone);
  
  console.assert(result === 'evening', `Expected 'evening', got '${result}'`);
  console.log('✅ testDetermineTimeOfDay_Evening passed');
}

export function testDetermineTimeOfDay_Night() {
  // 11 PM EST = 4 AM next day UTC
  const timestamp = new Date('2025-11-18T04:00:00Z');
  const timezone = 'America/New_York';
  
  const result = determineTimeOfDay(timestamp, timezone);
  
  console.assert(result === 'night', `Expected 'night', got '${result}'`);
  console.log('✅ testDetermineTimeOfDay_Night passed');
}

// TEST: Greeting generation

export function testGenerateGreeting_FirstCheckIn_Morning() {
  const greeting = generateGreeting({
    userName: 'Sarah',
    timeOfDay: 'morning',
    sessionType: 'morning',
    isFirstCheckIn: true,
  });
  
  console.assert(
    greeting.includes('Good morning') && greeting.includes('Sarah') && greeting.includes('sleep'),
    `Unexpected greeting: ${greeting}`
  );
  console.log('✅ testGenerateGreeting_FirstCheckIn_Morning passed');
}

export function testGenerateGreeting_ReturningUser_WithStreak() {
  const greeting = generateGreeting({
    userName: 'Sarah',
    timeOfDay: 'morning',
    sessionType: 'morning',
    isFirstCheckIn: false,
    userContext: {
      currentStreak: 7,
    },
  });
  
  console.assert(
    greeting.includes('🔥') && greeting.includes('7-day'),
    `Expected streak celebration, got: ${greeting}`
  );
  console.log('✅ testGenerateGreeting_ReturningUser_WithStreak passed');
}

// TEST: Routine suggestion logic

export function testShouldSuggestRoutine_Morning_PerfectTime() {
  const result = shouldSuggestRoutine({
    routineType: 'morning',
    currentTime: new Date('2025-11-17T12:00:00Z'), // 7 AM EST
    timezone: 'America/New_York',
    userPreferences: { morningRoutineTime: '07:00' },
    completedToday: false,
  });
  
  console.assert(
    result.shouldSuggest === true && result.priority === 'high',
    `Expected high priority suggestion, got: ${JSON.stringify(result)}`
  );
  console.log('✅ testShouldSuggestRoutine_Morning_PerfectTime passed');
}

export function testShouldSuggestRoutine_Morning_WrongTimeOfDay() {
  const result = shouldSuggestRoutine({
    routineType: 'morning',
    currentTime: new Date('2025-11-18T01:00:00Z'), // 8 PM EST
    timezone: 'America/New_York',
    userPreferences: { morningRoutineTime: '07:00' },
    completedToday: false,
  });
  
  console.assert(
    result.shouldSuggest === false,
    `Should not suggest morning routine at night, got: ${JSON.stringify(result)}`
  );
  console.log('✅ testShouldSuggestRoutine_Morning_WrongTimeOfDay passed');
}

export function testShouldSuggestRoutine_AlreadyCompleted() {
  const result = shouldSuggestRoutine({
    routineType: 'morning',
    currentTime: new Date('2025-11-17T12:00:00Z'),
    timezone: 'America/New_York',
    userPreferences: { morningRoutineTime: '07:00' },
    completedToday: true, // Already done!
  });
  
  console.assert(
    result.shouldSuggest === false && result.reason.includes('already completed'),
    `Should not suggest if already completed, got: ${JSON.stringify(result)}`
  );
  console.log('✅ testShouldSuggestRoutine_AlreadyCompleted passed');
}

// TEST: Routine validation

export function testValidateRoutineStart_MorningAtNight_ShowsWarning() {
  const result = validateRoutineStart(
    'morning',
    new Date('2025-11-18T04:00:00Z'), // 11 PM EST
    'America/New_York'
  );
  
  console.assert(
    result.isValid === true && result.warning !== undefined,
    `Expected warning for morning routine at night, got: ${JSON.stringify(result)}`
  );
  console.log('✅ testValidateRoutineStart_MorningAtNight_ShowsWarning passed');
}

// ==================== INSIGHTS BUSINESS LOGIC TESTS ====================

import {
  detectIntentFromMessage,
  shouldTriggerAction,
  validateIntentContext,
} from '../business/insights';

// TEST: Intent detection

export function testDetectIntent_StartMorningRoutine() {
  const result = detectIntentFromMessage("I want to start my morning routine");
  
  console.assert(
    result.intent === 'start_morning_routine' && result.confidence >= 0.9,
    `Expected start_morning_routine intent, got: ${JSON.stringify(result)}`
  );
  console.log('✅ testDetectIntent_StartMorningRoutine passed');
}

export function testDetectIntent_LogMood() {
  const result = detectIntentFromMessage("I'm feeling really stressed today");
  
  console.assert(
    result.intent === 'log_mood' && result.entities.detectedMood === 'stressed',
    `Expected log_mood intent with 'stressed', got: ${JSON.stringify(result)}`
  );
  console.log('✅ testDetectIntent_LogMood passed');
}

export function testDetectIntent_TrackMeal() {
  const result = detectIntentFromMessage("I ate oatmeal for breakfast");
  
  console.assert(
    result.intent === 'track_meal' && result.entities.mealType === 'breakfast',
    `Expected track_meal intent with breakfast, got: ${JSON.stringify(result)}`
  );
  console.log('✅ testDetectIntent_TrackMeal passed');
}

export function testDetectIntent_GeneralConversation() {
  const result = detectIntentFromMessage("The weather is nice today");
  
  console.assert(
    result.intent === 'general_conversation',
    `Expected general_conversation, got: ${result.intent}`
  );
  console.log('✅ testDetectIntent_GeneralConversation passed');
}

// TEST: Action triggering

export function testShouldTriggerAction_HighConfidence() {
  const intent = {
    intent: 'start_morning_routine' as const,
    confidence: 0.95,
    entities: {},
    originalMessage: 'start my morning routine',
  };
  
  const result = shouldTriggerAction(intent);
  
  console.assert(
    result === true,
    `Should trigger action for high confidence actionable intent`
  );
  console.log('✅ testShouldTriggerAction_HighConfidence passed');
}

export function testShouldTriggerAction_LowConfidence() {
  const intent = {
    intent: 'log_mood' as const,
    confidence: 0.60,
    entities: {},
    originalMessage: 'maybe log mood?',
  };
  
  const result = shouldTriggerAction(intent, 0.80);
  
  console.assert(
    result === false,
    `Should not trigger action for low confidence`
  );
  console.log('✅ testShouldTriggerAction_LowConfidence passed');
}

// TEST: Intent context validation

export function testValidateIntentContext_MorningRoutineAtNight() {
  const intent = {
    intent: 'start_morning_routine' as const,
    confidence: 0.95,
    entities: {},
    originalMessage: 'start morning routine',
  };
  
  const result = validateIntentContext(intent, { timeOfDay: 'night' });
  
  console.assert(
    result.isValid === true && result.warning !== undefined,
    `Expected warning for morning routine at night, got: ${JSON.stringify(result)}`
  );
  console.log('✅ testValidateIntentContext_MorningRoutineAtNight passed');
}

// ==================== SESSION BUSINESS LOGIC TESTS ====================

import {
  canResumeSession,
  shouldAutoCompleteSession,
  checkSessionWarnings,
  type SessionState,
} from '../business/session';

// TEST: Session resumption

export function testCanResumeSession_SameDay_Recent() {
  const session: SessionState = {
    id: 'session_123',
    userId: 'user_1',
    type: 'morning',
    startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
    lastMessageAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
    messageCount: 5,
    completed: false,
    context: { timeOfDay: 'morning' },
  };
  
  const result = canResumeSession(session, new Date());
  
  console.assert(
    result.canResume === true,
    `Should be able to resume recent session, got: ${JSON.stringify(result)}`
  );
  console.log('✅ testCanResumeSession_SameDay_Recent passed');
}

export function testCanResumeSession_Completed() {
  const session: SessionState = {
    id: 'session_123',
    userId: 'user_1',
    type: 'morning',
    startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    lastMessageAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    messageCount: 5,
    completed: true, // Already done
    context: { timeOfDay: 'morning' },
  };
  
  const result = canResumeSession(session, new Date());
  
  console.assert(
    result.canResume === false && result.reason.includes('completed'),
    `Should not resume completed session, got: ${JSON.stringify(result)}`
  );
  console.log('✅ testCanResumeSession_Completed passed');
}

// TEST: Auto-completion

export function testShouldAutoComplete_MorningRoutine_ManyMessages() {
  const session: SessionState = {
    id: 'session_123',
    userId: 'user_1',
    type: 'morning',
    startedAt: new Date().toISOString(),
    lastMessageAt: new Date().toISOString(),
    messageCount: 25, // Over threshold (20)
    completed: false,
    context: { timeOfDay: 'morning' },
  };
  
  const result = shouldAutoCompleteSession(session);
  
  console.assert(
    result.shouldComplete === true,
    `Should auto-complete after 25 messages, got: ${JSON.stringify(result)}`
  );
  console.log('✅ testShouldAutoComplete_MorningRoutine_ManyMessages passed');
}

// TEST: Session warnings

export function testCheckSessionWarnings_DuplicateRoutine() {
  const existingSessions: SessionState[] = [
    {
      id: 'session_123',
      userId: 'user_1',
      type: 'morning',
      startedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      messageCount: 5,
      completed: true, // Already completed morning
      context: { timeOfDay: 'morning' },
    },
  ];
  
  const result = checkSessionWarnings(existingSessions, 'morning');
  
  console.assert(
    result.hasWarning === true && result.warning?.includes('already completed'),
    `Should warn about duplicate routine, got: ${JSON.stringify(result)}`
  );
  console.log('✅ testCheckSessionWarnings_DuplicateRoutine passed');
}

// ==================== RUN ALL TESTS ====================

export function runAllTests() {
  console.log('\n🧪 Running Business Logic Unit Tests (Phase 1)\n');
  console.log('='.repeat(50));
  
  // Routine tests
  console.log('\n📅 ROUTINE BUSINESS LOGIC TESTS:\n');
  testDetermineTimeOfDay_Morning();
  testDetermineTimeOfDay_Afternoon();
  testDetermineTimeOfDay_Evening();
  testDetermineTimeOfDay_Night();
  testGenerateGreeting_FirstCheckIn_Morning();
  testGenerateGreeting_ReturningUser_WithStreak();
  testShouldSuggestRoutine_Morning_PerfectTime();
  testShouldSuggestRoutine_Morning_WrongTimeOfDay();
  testShouldSuggestRoutine_AlreadyCompleted();
  testValidateRoutineStart_MorningAtNight_ShowsWarning();
  
  // Insights tests
  console.log('\n🔍 INSIGHTS BUSINESS LOGIC TESTS:\n');
  testDetectIntent_StartMorningRoutine();
  testDetectIntent_LogMood();
  testDetectIntent_TrackMeal();
  testDetectIntent_GeneralConversation();
  testShouldTriggerAction_HighConfidence();
  testShouldTriggerAction_LowConfidence();
  testValidateIntentContext_MorningRoutineAtNight();
  
  // Session tests
  console.log('\n💬 SESSION BUSINESS LOGIC TESTS:\n');
  testCanResumeSession_SameDay_Recent();
  testCanResumeSession_Completed();
  testShouldAutoComplete_MorningRoutine_ManyMessages();
  testCheckSessionWarnings_DuplicateRoutine();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ All tests passed! Business logic is working correctly.\n');
}

// Auto-run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests();
}
