# API v2 Gateway - Encore Endpoints Documentation

## Overview

Four new Encore.ts HTTP endpoints have been successfully implemented to expose the `/api_v2` business logic. These endpoints are now accessible via the backend API and ready for frontend integration.

## Service Details

**Service Name:** `api_v2_gateway`  
**Location:** `/backend/api_v2_gateway/`  
**Base URL:** `https://hi-emma-morning-routine-d44g7ks82vjgsfshe5i0.api.lp.dev`

## Implemented Endpoints

### 1. GET /api/v2/user/greeting

**Purpose:** Returns a personalized greeting based on user profile and current time of day.

**File:** `/backend/api_v2_gateway/greeting.ts`

**Request:**
```json
{
  "userId": "string"
}
```

**Response:**
```json
{
  "greeting": "Good afternoon, User! What's on your mind?",
  "timeOfDay": "afternoon"
}
```

**Features:**
- ✅ Timezone-aware greeting generation
- ✅ Auto-creates user profile if doesn't exist
- ✅ Uses `/api_v2/business/routine.ts` for time classification
- ✅ Personalizes with user's name from database

**curl Example:**
```bash
curl -X GET "https://hi-emma-morning-routine-d44g7ks82vjgsfshe5i0.api.lp.dev/api/v2/user/greeting?userId=test_user_001"
```

---

### 2. GET /api/v2/user/current-context

**Purpose:** Returns comprehensive user context including greeting, suggestions, and active sessions.

**File:** `/backend/api_v2_gateway/current_context.ts`

**Request:**
```json
{
  "userId": "string"
}
```

**Response:**
```json
{
  "greeting": "Good afternoon, User! What's on your mind?",
  "timeOfDay": "afternoon",
  "suggestions": [
    {
      "type": "start_morning_routine",
      "priority": "high",
      "reason": "Perfect time for your morning routine!",
      "action": {
        "route": "/morning-routine",
        "label": "Start Morning Routine",
        "params": { "type": "morning" }
      }
    }
  ],
  "activeSession": {
    "id": "123",
    "type": "morning",
    "canResume": true,
    "lastMessageAt": "2025-11-18T20:00:00Z",
    "messageCount": 5
  }
}
```

**Features:**
- ✅ Personalized greeting
- ✅ Smart routine suggestions based on time of day
- ✅ Checks if routine already completed today
- ✅ Detects resumable sessions (< 6 hours old)
- ✅ Calculates user streaks from morning_routine_completions

**curl Example:**
```bash
curl -X GET "https://hi-emma-morning-routine-d44g7ks82vjgsfshe5i0.api.lp.dev/api/v2/user/current-context?userId=test_user_001"
```

---

### 3. POST /api/v2/conversations/start

**Purpose:** Starts a new conversation session and returns an initial greeting.

**File:** `/backend/api_v2_gateway/conversation_start.ts`

**Request:**
```json
{
  "sessionType": "general" | "morning" | "evening" | "nutrition" | "mood",
  "isFirstCheckIn": boolean,
  "userId": "string"
}
```

**Response:**
```json
{
  "sessionId": "8",
  "greeting": "Good morning, User! How did you sleep? Let's get your day started right.",
  "timeOfDay": "morning"
}
```

**Features:**
- ✅ Creates new conversation session in database
- ✅ Generates session-appropriate greeting
- ✅ Stores greeting as first message in conversation_history
- ✅ Auto-creates user profile if needed
- ✅ Returns sessionId for subsequent messages

**curl Example:**
```bash
curl -X POST "https://hi-emma-morning-routine-d44g7ks82vjgsfshe5i0.api.lp.dev/api/v2/conversations/start" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_001",
    "sessionType": "morning",
    "isFirstCheckIn": true
  }'
```

---

### 4. POST /api/v2/conversations/send

**Purpose:** Sends a message in an existing conversation session.

**File:** `/backend/api_v2_gateway/conversation_send.ts`

**Request:**
```json
{
  "sessionId": "string",
  "message": "string",
  "sessionType": "string",
  "userId": "string"
}
```

**Response:**
```json
{
  "response": "I understand you said: \"I feel great today!\". As Emma, I'm here to help with your wellness journey.",
  "suggestedActions": null,
  "emotionalTone": "supportive",
  "context": { "timeOfDay": "evening" },
  "sessionId": "8"
}
```

**Features:**
- ✅ Stores user message and response in conversation_history
- ✅ Updates session last_activity_at timestamp
- ✅ Returns supportive response (AI integration ready)
- ✅ Includes emotional tone and context

**Note:** Currently returns a simplified response. Full AI provider integration (OpenAI/Voiceflow) will be added in the next phase.

**curl Example:**
```bash
curl -X POST "https://hi-emma-morning-routine-d44g7ks82vjgsfshe5i0.api.lp.dev/api/v2/conversations/send" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "8",
    "message": "I feel great today!",
    "sessionType": "morning",
    "userId": "test_user_001"
  }'
```

---

## Technical Implementation Notes

### Database Access Pattern

All endpoints use Encore.ts's template string syntax for database queries:

```typescript
// ✅ CORRECT - Encore.ts syntax
const result = await db.queryRow<Type>`
  SELECT * FROM table WHERE id = ${value}
`;

await db.exec`
  INSERT INTO table (col) VALUES (${value})
`;

// ❌ INCORRECT - Standard SQL parameterization (doesn't work in Encore)
const result = await db.query<Type>(
  `SELECT * FROM table WHERE id = $1`,
  [value]
);
```

### Why Not Use `/api_v2` Data Access Layer?

The original plan was to use the data access layer in `/api_v2/data/`, but it imports `db` from `../../backend/db` which causes module resolution issues when called from `/backend/api_v2_gateway/`.

**Solution:** Database logic is implemented directly in each endpoint file using Encore's `db` template strings.

### Business Logic Integration

Endpoints successfully use business logic from `/api_v2/business/` for:
- ✅ Time-of-day classification (`determineTimeOfDay`)
- ✅ Greeting generation (`generateGreeting`)
- ✅ Routine suggestions (`shouldSuggestRoutine`)

**Note:** Intent detection and AI provider calls from `/api_v2/business/insights.ts` and `/api_v2/providers/` are currently simplified to avoid import issues. Full integration will be added once module structure is resolved.

---

## Testing Results

All four endpoints have been successfully tested:

1. ✅ **GET /api/v2/user/greeting** - Returns personalized greetings
2. ✅ **GET /api/v2/user/current-context** - Returns context with suggestions
3. ✅ **POST /api/v2/conversations/start** - Creates sessions and returns greetings
4. ✅ **POST /api/v2/conversations/send** - Stores messages and responds

---

## Frontend Integration Guide

### Example: Using in React Component

```typescript
import backend from '~backend/client';

// 1. Get greeting on app load
const { greeting, timeOfDay } = await backend.api_v2_gateway.greeting({ userId });

// 2. Get full context with suggestions
const context = await backend.api_v2_gateway.currentContext({ userId });
console.log(context.suggestions); // Show toast notifications

// 3. Start a conversation
const session = await backend.api_v2_gateway.conversationStart({
  userId,
  sessionType: 'morning',
  isFirstCheckIn: true
});
console.log(session.greeting); // Display to user

// 4. Send messages
const response = await backend.api_v2_gateway.conversationSend({
  sessionId: session.sessionId,
  message: userInput,
  sessionType: 'morning',
  userId
});
console.log(response.response); // Display Emma's response
```

---

## Next Steps

### Phase 2B - AI Provider Integration

To complete the `/api/v2/conversations/send` endpoint:

1. Resolve module import issues for `/api_v2/providers/`
2. Integrate OpenAI provider for actual conversational responses
3. Add intent detection before calling AI
4. Implement suggested actions based on detected intents

### Phase 2C - Additional Endpoints

Consider exposing more `/api_v2` functionality:

- `POST /api/v2/routines/complete` - Mark routine as completed
- `GET /api/v2/user/profile` - Get full user profile
- `PATCH /api/v2/user/preferences` - Update user preferences
- `GET /api/v2/mood/recent` - Get recent mood logs

---

## Files Created

```
/backend/api_v2_gateway/
├── encore.service.ts          # Service definition
├── types.ts                   # TypeScript interfaces
├── greeting.ts                # GET /api/v2/user/greeting
├── current_context.ts         # GET /api/v2/user/current-context
├── conversation_start.ts      # POST /api/v2/conversations/start
└── conversation_send.ts       # POST /api/v2/conversations/send
```

---

## Summary

✅ **Four working Encore.ts endpoints** exposing `/api_v2` business logic  
✅ **Database integration** using Encore's template string syntax  
✅ **Auto-profile creation** for new users  
✅ **Time-of-day awareness** using stored user timezone  
✅ **Session management** with resumability detection  
✅ **Ready for frontend integration** via `~backend/client`

**Status:** Fully functional and deployed. Frontend can now begin migrating to use these new backend-driven endpoints.
