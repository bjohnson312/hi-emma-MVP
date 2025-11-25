# Unified Pillar Architecture - Implementation Guide

## Overview

This document describes the **clean, unified architecture** for managing all wellness pillars in Emma. The Morning Routine pillar serves as the **reference implementation** that should be replicated for all other pillars.

## Architecture Principles

### 1. **Never Fail Due to Missing Data**
- If a user doesn't have a routine/plan/tracker, **auto-create** one
- Never return errors like "No active routine found"
- Gracefully initialize data structures on first use

### 2. **Dedicated Tables for Each Pillar**
- ❌ **NO MORE**: Storing data in `user_profiles.morning_routine_preferences` (JSONB)
- ✅ **USE**: Dedicated tables like `morning_routine_preferences`, `morning_routine_completions`, `morning_routine_journal`
- Each pillar owns its data model

### 3. **Comprehensive Logging**
- Every action logs to the pillar's journal table
- Journal entries track: type, description, metadata, timestamp
- Enables full audit trail and user activity history

### 4. **Emma Memory Integration**
- Significant changes update Emma's memory
- Preferences, habits, and patterns are remembered
- Enables personalized, contextual conversations

### 5. **Unified Workflow**
```
User Intent (Chat)
    ↓
Intent Detection (AI parsing)
    ↓
Action Classification (what to do)
    ↓
Database Update (pillar tables)
    ↓
Journal Logging (audit trail)
    ↓
Memory Update (if significant)
    ↓
Response (natural confirmation)
```

---

## Morning Routine: Reference Implementation

### Database Tables

```sql
-- Core routine definition
CREATE TABLE morning_routine_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  routine_name TEXT,
  activities JSONB NOT NULL DEFAULT '[]',
  wake_time TEXT,
  duration_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Daily completions
CREATE TABLE morning_routine_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activities_completed JSONB NOT NULL DEFAULT '[]',
  all_completed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  mood_rating INTEGER,
  energy_level INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, completion_date)
);

-- Activity journal (audit log)
CREATE TABLE morning_routine_journal (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  entry_type TEXT NOT NULL, -- 'activity_added', 'activity_completed', 'routine_created', etc.
  entry_text TEXT NOT NULL,
  activity_name TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Backend Workflow Implementation

**File**: `/backend/conversation/chat.ts`

#### Step 1: Intent Detection (AI)
Emma's system prompt instructs the AI to emit structured commands:
```
When user mentions morning activity:
→ "ADD_ROUTINE_ACTIVITY: {name: "yoga", duration: 10, icon: "🧘"}"
```

#### Step 2: Processing Function
```typescript
async function processMorningRoutineActivity(
  userId: string, 
  activity: MorningRoutineActivity,
  context: { userMessage: string; emmaReply: string }
): Promise<void> {
  
  // Check if routine exists
  const existingRoutine = await db.queryRow<MorningRoutinePreference>`
    SELECT * FROM morning_routine_preferences
    WHERE user_id = ${userId} AND is_active = true
  `;

  if (!existingRoutine) {
    // FIX 1: Auto-create routine if missing
    await db.exec`
      INSERT INTO morning_routine_preferences (
        user_id, routine_name, activities, duration_minutes, is_active
      ) VALUES (
        ${userId}, 'My Morning Routine', 
        ${JSON.stringify([activity])}::jsonb,
        ${activity.duration_minutes || 5}, true
      )
    `;

    // FIX 3: Log to journal
    await logJournalEntry(
      userId, "routine_created",
      `Created morning routine with first activity: ${activity.name}`,
      activity.name,
      { duration_minutes: activity.duration_minutes, source: "conversation" }
    );

    // FIX 4: Update Emma Memory
    await extractAndStoreMemories(userId, context.userMessage,
      `I've created your morning routine with ${activity.name}.`
    );
    
    return;
  }

  // Add activity to existing routine
  const currentActivities = parseActivities(existingRoutine.activities);
  const newActivities = [...currentActivities, activity];
  
  await db.exec`
    UPDATE morning_routine_preferences
    SET activities = ${JSON.stringify(newActivities)}::jsonb,
        duration_minutes = ${newDuration},
        updated_at = NOW()
    WHERE user_id = ${userId} AND is_active = true
  `;

  // Log to journal
  await logJournalEntry(userId, "activity_added", 
    `Added new activity: ${activity.name}`, activity.name,
    { duration_minutes: activity.duration_minutes, source: "conversation" }
  );

  // Update memory
  await extractAndStoreMemories(userId, context.userMessage,
    `I've added ${activity.name} to your morning routine.`
  );
}
```

#### Step 3: Integration in Chat Handler
```typescript
// In chat.ts main handler:
const routineActivityMatches = emmaReply.matchAll(/ADD_ROUTINE_ACTIVITY:\s*\{([^}]+)\}/gs);

for (const match of routineActivityMatches) {
  if (session_type === "morning") {
    const activity = parseActivityFromMatch(match);
    await processMorningRoutineActivity(user_id, activity, {
      userMessage: user_message,
      emmaReply: cleanedReply
    });
  }
}
```

### Frontend Components

**File**: `/frontend/components/views/MorningRoutineView.tsx`

Key features:
- Template selection (5 pre-built routines)
- Custom routine builder
- Activity tracking with completion checkboxes
- Progress visualization
- Edit mode for modifications
- Journal view showing activity history

**File**: `/frontend/components/MorningRoutineJournal.tsx`

Displays:
- Activity log grouped by date
- Entry types with color coding
- Timestamps for all actions
- Source attribution (UI vs conversation)

---

## How to Extend to Other Pillars

### Example: Doctor's Orders Pillar

#### 1. Create Database Tables
```sql
-- Core medication/order tracking
CREATE TABLE doctors_orders_tracking (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  order_type TEXT NOT NULL, -- 'medication', 'exercise', 'dietary_restriction'
  medication_name TEXT,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Adherence log
CREATE TABLE doctors_orders_adherence (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  order_id BIGINT REFERENCES doctors_orders_tracking(id),
  taken_at TIMESTAMP DEFAULT NOW(),
  missed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Journal/audit log
CREATE TABLE doctors_orders_journal (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  entry_type TEXT NOT NULL, -- 'order_added', 'dose_taken', 'dose_missed', 'order_completed'
  entry_text TEXT NOT NULL,
  medication_name TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Create Processing Function
```typescript
// /backend/conversation/chat.ts (or dedicated file)

async function processDoctorsOrder(
  userId: string,
  orderData: {
    medication: string;
    dosage: string;
    frequency: string;
  },
  context: { userMessage: string; emmaReply: string }
): Promise<void> {
  
  // Check if order already exists
  const existing = await db.queryRow`
    SELECT * FROM doctors_orders_tracking
    WHERE user_id = ${userId} 
      AND medication_name = ${orderData.medication}
      AND active = true
  `;

  if (!existing) {
    // Create new order
    await db.exec`
      INSERT INTO doctors_orders_tracking (
        user_id, order_type, medication_name, dosage, frequency, active
      ) VALUES (
        ${userId}, 'medication', 
        ${orderData.medication}, ${orderData.dosage}, ${orderData.frequency},
        true
      )
    `;

    // Log to journal
    await logDoctorsOrderJournalEntry(
      userId, "order_added",
      `Started tracking: ${orderData.medication} ${orderData.dosage} ${orderData.frequency}`,
      orderData.medication,
      { dosage: orderData.dosage, frequency: orderData.frequency, source: "conversation" }
    );

    // Update Emma Memory
    await extractAndStoreMemories(userId, context.userMessage,
      `I'm now tracking your ${orderData.medication} medication.`
    );
  }
}
```

#### 3. Update System Prompt
```typescript
// In buildSystemPrompt():

const sessionPrompts = {
  doctors_orders: `${basePrompt}

This is a medication/doctor's orders conversation.

MEDICATION TRACKING:
- When ${userName} mentions a medication, automatically track it
- Listen for: "I'm taking [medication]", "My doctor prescribed [medication]", "I take [dosage] of [medication]"
- Format: "ADD_MEDICATION: {medication: "[name]", dosage: "[amount]", frequency: "[daily/twice daily/etc]"}"
- Confirm: "I've added that to your medication tracker! 📋"

ADHERENCE LOGGING:
- Listen for: "I took my [medication]", "I missed my [medication]"
- Format: "LOG_ADHERENCE: {medication: "[name]", taken: true/false}"

Be supportive and non-judgmental about adherence.`,
  // ... other pillars
};
```

#### 4. Integrate in Chat Handler
```typescript
// In main chat handler:
const medicationMatches = emmaReply.matchAll(/ADD_MEDICATION:\s*\{([^}]+)\}/gs);

for (const match of medicationMatches) {
  if (session_type === "doctors_orders") {
    const orderData = parseMedicationFromMatch(match);
    await processDoctorsOrder(user_id, orderData, {
      userMessage: user_message,
      emmaReply: cleanedReply
    });
  }
}
```

---

## Pillar Implementation Checklist

When implementing a new pillar, ensure:

### Database Layer
- [ ] Create `{pillar}_tracking` table (core data)
- [ ] Create `{pillar}_log` table (if needed for daily/event tracking)
- [ ] Create `{pillar}_journal` table (audit log with entry_type, entry_text, metadata)
- [ ] Add appropriate indexes
- [ ] Write migration file

### Backend Layer
- [ ] Create processing function: `process{Pillar}Action()`
- [ ] Implement auto-creation logic (never fail with "not found")
- [ ] Add journal logging via `log{Pillar}JournalEntry()`
- [ ] Integrate Emma Memory updates via `extractAndStoreMemories()`
- [ ] Handle duplicate detection gracefully

### Chat Integration
- [ ] Update system prompt with pillar-specific instructions
- [ ] Define structured command format (e.g., `ADD_ACTIVITY`, `LOG_ADHERENCE`)
- [ ] Add pattern matching in main chat handler
- [ ] Test conversation flow end-to-end

### Frontend Layer
- [ ] Create view component: `{Pillar}View.tsx`
- [ ] Create journal component: `{Pillar}Journal.tsx`
- [ ] Implement tracking UI (checkboxes, progress bars, stats)
- [ ] Add edit/modification capabilities
- [ ] Connect to backend endpoints

### Testing
- [ ] Test conversation-based creation (no existing data)
- [ ] Test adding to existing structures
- [ ] Verify journal entries appear correctly
- [ ] Confirm memory updates work
- [ ] Test UI displays all data properly

---

## Key Files Reference

### Morning Routine (Reference Implementation)
- **Database**: `/backend/db/migrations/026_create_morning_routine_tracking.up.sql`
- **Types**: `/backend/morning/routine_types.ts`, `/backend/morning/journal_types.ts`
- **Processing**: `/backend/conversation/chat.ts` (lines 23-171)
- **Journal Logging**: `/backend/morning/add_journal_entry.ts`
- **Endpoints**: `/backend/morning/*.ts`
- **Frontend View**: `/frontend/components/views/MorningRoutineView.tsx`
- **Frontend Journal**: `/frontend/components/MorningRoutineJournal.tsx`

### Chat Integration
- **Main Handler**: `/backend/conversation/chat.ts`
- **Memory System**: `/backend/conversation/memory.ts`
- **Intent Detection**: `/backend/insights/detect_intents.ts`
- **Suggestion Application**: `/backend/insights/apply_suggestion.ts`

---

## Benefits of This Architecture

### 1. **Scalability**
- Add new pillars without modifying existing ones
- Each pillar is self-contained with its own tables and logic

### 2. **Maintainability**
- Clear separation of concerns
- Well-documented workflow
- Easy to debug with comprehensive logging

### 3. **User Experience**
- Never fails with "not found" errors
- Natural conversation flow
- Complete activity history
- Personalized responses via memory

### 4. **Data Integrity**
- Proper relational database design
- Full audit trail in journal tables
- No data loss through JSONB field overwrites

### 5. **Analytics Ready**
- Structured data enables insights
- Easy to query patterns and trends
- Provider portal can access detailed history

---

## Migration Strategy

For existing pillars using legacy JSONB fields:

1. **Create new tables** (as shown above)
2. **Implement new processing functions** (with auto-creation)
3. **Update chat.ts** to use new functions
4. **Keep legacy endpoints** for backwards compatibility (read-only)
5. **Migrate existing data** via one-time script (if needed)
6. **Deprecate old endpoints** after frontend migration

**DO NOT** modify legacy fields from new code - write to new tables only.

---

## Questions?

This architecture is designed to be the **single source of truth** for implementing all wellness pillars. The Morning Routine pillar demonstrates every aspect of the pattern.

For implementation guidance, refer to:
- `/backend/conversation/chat.ts` - Full workflow implementation
- `/backend/morning/` - Complete pillar example
- This document - Architectural principles and extension guide
