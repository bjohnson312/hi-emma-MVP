# API v2 - Clean Modular Architecture

## Overview

This is the **new modular API architecture** designed for cross-platform compatibility (Web + React Native). It provides a clean separation between:

- **Routes**: HTTP endpoint definitions
- **Controllers**: Request/response handling (thin layer)
- **Services**: Business logic orchestration
- **Business**: Core business rules (pure functions, no I/O)
- **Validation**: Input validation schemas (Zod)
- **Types**: All TypeScript interfaces and DTOs
- **Utils**: Reusable utility functions

## Status: 🚧 SCAFFOLDING PHASE

**IMPORTANT**: This is currently a **scaffold** with placeholder implementations.

- ✅ Folder structure complete
- ✅ Type definitions complete
- ✅ Route stubs complete
- ⏳ Business logic - TODO
- ⏳ Service implementations - TODO
- ⏳ Database integration - TODO
- ⏳ Testing - TODO

## Architecture Principles

### 1. Clean Separation of Concerns

```
Request → Route → Controller → Service → Business Logic → Database
                              ↓
                         Validation
```

### 2. Shared Code Strategy

All types, validation, and business logic in `/api_v2` can be imported by:
- React Native mobile app
- Web frontend
- Backend services

### 3. Standardized API Responses

All endpoints return:
```typescript
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: { ... };
  };
}
```

### 4. Validation-First Design

All inputs validated using Zod schemas from `/api_v2/validation/`.

## Folder Structure

```
/api_v2/
  /types/              # TypeScript interfaces and DTOs
  /validation/         # Zod schemas for input validation
  /routes/             # API route definitions
  /controllers/        # Request/response handlers
  /services/           # Business logic orchestration
  /business/           # Core business rules (pure functions)
  /utils/              # Reusable utilities
  /speech/             # Speech-to-text and text-to-speech
  /routines/           # Morning/evening routine engine
  /conversations/      # Emma conversation engine
  /nutrition/          # Nutrition and meal planning
  /mood/               # Mood tracking and analysis
  /journal/            # Wellness journal
  /care_team/          # Care team management
  /onboarding/         # Onboarding workflow
  /notifications/      # Notification scheduling
  index.ts             # Main entry point
```

## API Endpoints

### Authentication
- `POST /api/v2/auth/signup`
- `POST /api/v2/auth/login`
- `POST /api/v2/auth/logout`
- `GET /api/v2/auth/me`

### User Profile
- `GET /api/v2/user/profile`
- `PATCH /api/v2/user/profile`
- `GET /api/v2/user/preferences`
- `PATCH /api/v2/user/preferences`

### Onboarding
- `GET /api/v2/onboarding/status`
- `POST /api/v2/onboarding/steps/:stepId/complete`
- `POST /api/v2/onboarding/complete`

### Routines
- `POST /api/v2/routines/morning/start`
- `POST /api/v2/routines/morning/next-step`
- `GET /api/v2/routines/morning/session/:sessionId`
- `POST /api/v2/routines/morning/complete`
- `POST /api/v2/routines/evening/start`
- `GET /api/v2/routines/history`
- `GET /api/v2/routines/stats`

### Conversations (Emma)
- `POST /api/v2/conversations/send`
- `GET /api/v2/conversations/sessions`
- `GET /api/v2/conversations/sessions/:id/messages`
- `POST /api/v2/conversations/sessions/:id/end`

### Wellness - Mood
- `POST /api/v2/wellness/mood`
- `GET /api/v2/wellness/mood/history`
- `GET /api/v2/wellness/mood/insights`

### Wellness - Nutrition
- `POST /api/v2/nutrition/plan/generate`
- `GET /api/v2/nutrition/plan/current`
- `POST /api/v2/nutrition/meals/weekly`
- `POST /api/v2/nutrition/analyze-image`

### Journal
- `GET /api/v2/journal/chapters`
- `POST /api/v2/journal/chapters`
- `GET /api/v2/journal/entries`
- `POST /api/v2/journal/entries`

### Care Team
- `GET /api/v2/care-team/members`
- `POST /api/v2/care-team/members`
- `PATCH /api/v2/care-team/members/:id`
- `DELETE /api/v2/care-team/members/:id`

### Insights
- `GET /api/v2/insights/suggestions`
- `POST /api/v2/insights/suggestions/:id/apply`
- `POST /api/v2/insights/suggestions/:id/dismiss`

### Progress
- `GET /api/v2/progress/summary`
- `GET /api/v2/milestones`

### Notifications
- `GET /api/v2/notifications/preferences`
- `PATCH /api/v2/notifications/preferences`
- `POST /api/v2/notifications/schedule`

### Speech Services (NEW - Critical for Mobile)
- `POST /api/v2/speech/transcribe` - Speech-to-text
- `POST /api/v2/speech/synthesize` - Text-to-speech
- `GET /api/v2/speech/voices` - Available voices

## Next Steps

1. ✅ Complete scaffolding (CURRENT)
2. ⏳ Implement speech services (critical blocker for mobile)
3. ⏳ Implement routine workflow engine
4. ⏳ Implement conversation engine
5. ⏳ Implement nutrition services
6. ⏳ Implement mood tracking
7. ⏳ Database integration
8. ⏳ Testing
9. ⏳ Frontend migration

## DO NOT

- ❌ Modify existing `/backend/*` code
- ❌ Import from existing backend (keep isolated)
- ❌ Connect to frontend until approved
- ❌ Deploy or expose endpoints until approved
