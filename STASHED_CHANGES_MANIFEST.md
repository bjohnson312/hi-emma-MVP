# Git Stash Recovery Guide
**Created:** 2025-11-30
**Stash Name:** care_plans_and_morning_updates_2025-11-30

---

## Executive Summary

This document catalogs all changes made during the care_plans implementation and morning routine bug fixes that are being stashed for future reference.

**Total Changes:**
- **27 files modified/created**
- **~2,500 lines of code**
- **1 database migration**
- **17 backend API endpoints**
- **4 frontend components**
- **3 bug fixes**

---

## Files Changed (Complete Manifest)

### Backend - NEW FILES (17 files)

#### Care Plans Service (`backend/care_plans/`)
1. `encore.service.ts` - Service definition
2. `types.ts` - TypeScript interfaces (CarePlan, CarePlanItem, etc.)
3. `create_plan.ts` - Create care plan API
4. `update_plan.ts` - Update care plan API (uses COALESCE for partial updates)
5. `delete_plan.ts` - Soft delete care plan API
6. `get_user_plans.ts` - Get user's care plans API
7. `create_item.ts` - Create care plan item API
8. `update_item.ts` - Update care plan item API (uses COALESCE for partial updates)
9. `delete_item.ts` - Delete care plan item API
10. `get_plan_items.ts` - Get items for a plan API
11. `get_today_tasks.ts` - Get today's tasks API (handles day-of-week filtering)
12. `mark_item_complete.ts` - Mark item complete/incomplete API
13. `get_completions.ts` - Get completion history API (fixed conditional queries)
14. `get_stats.ts` - Get adherence stats API (calculates streaks)
15. `presets.ts` - 6 condition preset templates + getPresets API
16. `generate_ai_plan.ts` - AI-assisted plan generation API (uses presets)

### Backend - MODIFIED FILES (4 files)

#### Bug Fixes
1. **`backend/conversation/chat.ts`** (Line 740)
   - Added defensive null check for `resolvedActivity`
   - Prevents "possibly null" TypeScript error
   - Impact: Safer numeric choice handling in conversations

2. **`backend/morning/mark_activity_complete.ts`** (Lines 141, 151)
   - Changed `null` → `undefined` in logJournalEntry call
   - Fixed import: `updateProgress` → `updateJourneyProgress`
   - Impact: Type correctness, proper milestone tracking

3. **`backend/morning/mark_all_complete.ts`** (Lines 123, 138)
   - Changed `null` → `undefined` in logJournalEntry call
   - Fixed import: `updateProgress` → `updateJourneyProgress`
   - Impact: Type correctness, proper milestone tracking

#### Care Plans Integration
4. **`backend/notifications/scheduler.ts`**
   - Added `ENABLE_CARE_PLAN_REMINDERS` feature flag support
   - Added care_plan_items querying alongside doctors_orders
   - Unified medication reminder logic
   - Backward compatible with existing doctors_orders

### Database - NEW FILE (1 file)

1. **`backend/db/migrations/043_create_care_plans.up.sql`**
   - Creates `care_plans` table (id, user_id, name, condition_key, description, is_active)
   - Creates `care_plan_items` table (id, care_plan_id, type, label, details JSONB, frequency, times_of_day JSONB, days_of_week JSONB, reminder_enabled, is_active, sort_order)
   - Creates `care_plan_completions` table (id, user_id, care_plan_id, completion_date, completed_item_ids JSONB, all_completed, notes)
   - All tables have proper indexes and constraints
   - UNIQUE constraint on (user_id, care_plan_id, completion_date)
   - Foreign keys with CASCADE delete

### Frontend - NEW COMPONENTS (4 files)

1. **`frontend/components/CarePlanSetup.tsx`** (227 lines)
   - Preset selection UI (6 condition cards)
   - AI plan generation flow
   - Item customization with enable/disable toggles
   - Medical disclaimer banner
   - Type icons: 💊 medication, 🏃 activity, 📊 measurement, ✅ other

2. **`frontend/components/CarePlanItemEditor.tsx`** (213 lines)
   - Modal for adding/editing care plan items
   - Type selector (4 types)
   - Fields: name, dosage, instructions, frequency, times, reminder toggle
   - Time picker with add/remove functionality
   - Supports CRUD operations

3. **`frontend/components/TodayCareTasks.tsx`** (98 lines)
   - Dashboard widget showing today's tasks
   - Completed X/Y counter
   - Scheduled times display
   - Empty state with "Get Started" CTA
   - Designed for ConversationalCheckIn integration

4. **`frontend/components/views/DoctorsOrdersView.tsx`** (488 lines)
   - Complete rewrite with 4 tabs (Overview, Medications, Activities, Care Plan)
   - Overview tab: Today's tasks, stats (completion rate, streak)
   - Medications tab: CRUD with edit/delete buttons
   - Activities tab: Activities, measurements, other items
   - Care Plan tab: Plan details, create new plan button
   - Empty state with "Create Care Plan" CTA
   - Integrates CarePlanSetup and CarePlanItemEditor
   - JSON parsing helpers for JSONB fields

### Frontend - MODIFIED FILES (3 files)

1. **`frontend/components/Sidebar.tsx`** (Line 69)
   - BEFORE: `badge: "coming-soon"` (original state)
   - AFTER: No badge (removed coming-soon)
   - Tooltip changed: "Manage medications and treatment plans" → "Manage medications and care plans"

2. **`frontend/components/MobileMenu.tsx`** (Line 46)
   - BEFORE: Unknown (possibly "Medications" or missing)
   - AFTER: Label set to "Doctor's Orders"

3. **`frontend/components/ConversationalCheckIn.tsx`** (Lines ~548-553)
   - BEFORE: No care tasks integration
   - AFTER: Added TodayCareTasks component after morning check-in completion
   - Shows care tasks when `sessionType === "morning" && conversationComplete`
   - Then REVERTED: Removed TodayCareTasks integration again (not in stash)

### Configuration - MODIFIED FILES (2 files)

1. **`frontend/config.ts`**
   - Added: `export const ENABLE_CARE_PLAN_REMINDERS = false;`
   - Purpose: Feature flag for care plan notifications

2. **Documentation - NEW FILES (2 files)**
   - `CARE_PLANS_MIGRATION_STATUS.md` - Deployment guide
   - `CARE_PLANS_IMPLEMENTATION_SUMMARY.md` - (this file)

---

## API Endpoints Created (14 endpoints)

### Care Plan Management
1. `POST /care-plans` - Create care plan
2. `PATCH /care-plans/:plan_id` - Update care plan (COALESCE for partial updates)
3. `DELETE /care-plans/:plan_id` - Soft delete care plan
4. `GET /care-plans/user/:user_id` - Get user's care plans
5. `GET /care-plans/presets` - Get preset templates (6 presets)
6. `POST /care-plans/generate` - Generate AI plan from condition

### Care Plan Items
7. `POST /care-plans/items` - Create item
8. `PATCH /care-plans/items/:item_id` - Update item (COALESCE for partial updates)
9. `DELETE /care-plans/items/:item_id` - Delete item
10. `GET /care-plans/:care_plan_id/items` - Get plan items

### Daily Tasks & Tracking
11. `GET /care-plans/today/:user_id` - Get today's tasks (day-of-week filtering)
12. `POST /care-plans/complete` - Mark item complete/incomplete
13. `GET /care-plans/completions/:user_id` - Get completion history
14. `GET /care-plans/stats/:user_id` - Get adherence stats (streaks, completion rate)

---

## Preset Templates

**6 built-in condition presets:**

1. **💊 Hypertension** - Blood pressure medication, BP check, 15-min walk, sodium tracking
2. **🩸 Diabetes Type 2** - Diabetes medication, blood sugar check, 30-min exercise 5x/week, meal planning
3. **🏥 Post-Surgery** - Pain medication as-needed, short walks 3x/day, wound care check, ice application
4. **⚖️ Weight Loss** - Morning exercise 5x/week, daily weight tracking, meal logging, 8 glasses water
5. **❤️ Heart Health** - Heart medication, cardio exercise 5x/week, heart rate monitoring, healthy diet
6. **✨ Custom** - Blank template for custom plan creation

---

## Technical Improvements

### 1. SQL Query Improvements
**Problem:** Dynamic SQL queries with `db.raw()` caused TypeScript errors
**Solution:** Used conditional branching with separate queries instead

**Example (get_completions.ts):**
```typescript
// BEFORE (broken):
query = db.query`
  SELECT * FROM care_plan_completions
  WHERE user_id = ${user_id}
  ${start_date ? db.raw(`AND completion_date >= '${start_date.toISOString()}'`) : db.raw('')}
`;

// AFTER (works):
if (start_date && end_date) {
  query = db.query`SELECT * WHERE user_id = ${user_id} AND completion_date >= ${start_date} AND completion_date <= ${end_date}`;
} else if (start_date) {
  query = db.query`SELECT * WHERE user_id = ${user_id} AND completion_date >= ${start_date}`;
} else {
  query = db.query`SELECT * WHERE user_id = ${user_id}`;
}
```

### 2. Partial Update Pattern
**Problem:** Dynamic column updates with `db.raw()` caused syntax errors
**Solution:** Used `COALESCE` to allow optional field updates

**Example (update_plan.ts):**
```typescript
// BEFORE (broken):
const updates: string[] = [];
if (name !== undefined) updates.push(`name = $${values.length + 1}`);
const result = await db.queryRow`UPDATE ... SET ${db.raw(updates.join(', '))}`;

// AFTER (works):
const result = await db.queryRow`
  UPDATE care_plans
  SET 
    name = COALESCE(${name}, name),
    description = COALESCE(${description}, description),
    is_active = COALESCE(${is_active}, is_active),
    updated_at = NOW()
  WHERE id = ${plan_id}
  RETURNING *
`;
```

### 3. Type Safety for JSONB Fields
**Problem:** Database returns `any` for JSONB columns
**Solution:** Created `parseJsonField<T>()` helper

**Example (get_today_tasks.ts):**
```typescript
function parseJsonField<T>(field: any): T {
  if (typeof field === 'string') {
    return JSON.parse(field);
  }
  return field as T;
}

const timesOfDay = parseJsonField<string[]>(item.times_of_day);
const details = parseJsonField<Record<string, any>>(item.details);
```

### 4. Index Signature Issue
**Problem:** `ItemDetails` interface with additional fields not supported
```typescript
// BEFORE (broken):
export interface ItemDetails {
  dosage?: string;
  instructions?: string;
  [key: string]: any;  // ❌ Not supported with other fields
}

// AFTER (works):
export type ItemDetails = Record<string, any>;
```

---

## Bug Fixes (3 files)

### 1. conversation/chat.ts:740
**Error:** `'resolvedActivity' is possibly 'null'`

**Fix:**
```typescript
// BEFORE:
if (choiceIndex >= 0 && choiceIndex < pendingCompletion.candidates.length) {
  resolvedActivity = pendingCompletion.candidates[choiceIndex];
  console.log(`Resolved to: "${resolvedActivity.activityName}"`);  // ❌ Possibly null
}

// AFTER:
if (choiceIndex >= 0 && choiceIndex < pendingCompletion.candidates.length) {
  resolvedActivity = pendingCompletion.candidates[choiceIndex];
  
  if (resolvedActivity) {  // ✅ Safe guard
    console.log(`Resolved to: "${resolvedActivity.activityName}"`);
  }
}
```

### 2. morning/mark_activity_complete.ts:141, 151
**Error 1:** `Argument of type 'null' is not assignable to parameter of type 'string | undefined'`
**Error 2:** `Property 'updateProgress' does not exist`

**Fix:**
```typescript
// BEFORE:
await logJournalEntry(user_id, "all_activities_completed", `...`, null, {...});  // ❌ null
const { updateProgress } = await import("../journey/update_progress");  // ❌ Wrong name
await updateProgress({ user_id, milestone_id: "morning_routine_complete", increment: 1 });

// AFTER:
await logJournalEntry(user_id, "all_activities_completed", `...`, undefined, {...});  // ✅ undefined
const { updateJourneyProgress } = await import("../journey/update_progress");  // ✅ Correct name
await updateJourneyProgress(user_id, "morning_routine_completed", true);
```

### 3. morning/mark_all_complete.ts:123, 138
**Same errors as #2, same fixes applied**

---

## Feature Flag System

**Backend Feature Flag:**
```typescript
// backend/notifications/scheduler.ts
const ENABLE_CARE_PLAN_REMINDERS = process.env.ENABLE_CARE_PLAN_REMINDERS === "true";

if (ENABLE_CARE_PLAN_REMINDERS) {
  // Query care_plan_items and send reminders
}
```

**Frontend Feature Flag:**
```typescript
// frontend/config.ts
export const ENABLE_CARE_PLAN_REMINDERS = false;
```

**Purpose:**
- Allows deploying care_plans code without activating reminders
- Can enable in staging first, then production
- Backward compatible with existing doctors_orders reminders

---

## UI/UX Patterns

### Empty State Pattern
```typescript
if (!plan) {
  return (
    <div className="empty-state">
      <Icon className="w-16 h-16" />
      <h3>No care plan added yet</h3>
      <p>Create a personalized plan...</p>
      <Button onClick={startSetup}>Create Care Plan</Button>
    </div>
  );
}
```

### Tab Navigation Pattern
```typescript
const [activeTab, setActiveTab] = useState<"overview" | "medications" | "activities" | "setup">("overview");

<div className="tabs">
  <button onClick={() => setActiveTab("overview")} className={activeTab === "overview" ? "active" : ""}>
    Overview
  </button>
  {/* ... other tabs */}
</div>

{activeTab === "overview" && <OverviewContent />}
{activeTab === "medications" && <MedicationsContent />}
```

### CRUD with Optimistic Updates
```typescript
const handleToggleComplete = async (task: TodayTask) => {
  // Optimistic update
  setTodayTasks(tasks => tasks.map(t => 
    t.item.id === task.item.id ? { ...t, completed: !t.completed } : t
  ));
  
  try {
    await backend.care_plans.markItemComplete({
      user_id: userId,
      item_id: task.item.id,
      completed: !task.completed
    });
    toast({ title: "Success", description: "Task updated" });
  } catch (error) {
    // Revert on failure
    setTodayTasks(tasks => tasks.map(t => 
      t.item.id === task.item.id ? { ...t, completed: task.completed } : t
    ));
    toast({ title: "Error", variant: "destructive" });
  }
};
```

---

## What Got Reverted Before Stash

**Files that were modified AFTER initial implementation:**

1. **`frontend/components/Sidebar.tsx`**
   - Re-added `badge: "coming-soon"` 
   - Reverted tooltip to "treatment plans"

2. **`frontend/components/MobileMenu.tsx`**
   - Changed label from "Medications" to "Doctor's Orders"

3. **`frontend/components/ConversationalCheckIn.tsx`**
   - REMOVED TodayCareTasks integration
   - This revert is NOT in the stash

**Why these were reverted:**
- To create a "safe mode" where care_plans exists but isn't user-facing
- Allows backend to deploy without forcing UI changes

---

## Restoring From Stash (Future Reference)

### To See What's in the Stash:
```bash
git stash list
# Should show: stash@{0}: care_plans_and_morning_updates_2025-11-30

git stash show -p stash@{0}
# Shows full diff of all changes
```

### To Restore the Stash:
```bash
# Apply and keep stash (safe):
git stash apply stash@{0}

# OR apply and remove stash:
git stash pop stash@{0}
```

### To Selectively Restore Files:
```bash
# Restore only backend files:
git checkout stash@{0} -- backend/care_plans/
git checkout stash@{0} -- backend/db/migrations/043_create_care_plans.up.sql

# Restore only specific components:
git checkout stash@{0} -- frontend/components/CarePlanSetup.tsx
git checkout stash@{0} -- frontend/components/views/DoctorsOrdersView.tsx
```

### To Abandon the Stash:
```bash
git stash drop stash@{0}
# WARNING: This permanently deletes the stash
```

---

## Lessons Learned

### 1. Always Test Deployment Pipeline First
**Problem:** Built locally but never deployed to preview environment
**Solution:** Test `git push` + verify deployment before doing large features

### 2. Feature Flags Are Essential
**Problem:** All-or-nothing deployment of 27 files
**Solution:** Use feature flags to deploy code without activating features

### 3. Incremental Rollout Strategy
**Problem:** Frontend + Backend + Database changes all at once
**Better approach:**
- Phase 1: Backend APIs only (dormant)
- Phase 2: Database migration (tables exist but unused)
- Phase 3: Frontend UI (behind feature flag)
- Phase 4: Enable feature flag in staging
- Phase 5: Enable in production

### 4. Backward Compatibility Matters
**Good:** Care_plans notification logic runs alongside doctors_orders
**Bad:** Didn't consider migration path from doctors_orders → care_plans

### 5. Type Safety vs. Dynamic Queries
**Problem:** Encore's SQL template literals don't support `db.raw()` well
**Solution:** Use conditional branching or COALESCE pattern

---

## Reusable Patterns for Next Implementation

### 1. Encore SQL Partial Update Pattern
```typescript
export const updateResource = api<UpdateRequest, Resource>(
  { expose: true, method: "PATCH", path: "/resource/:id" },
  async (req) => {
    const { id, field1, field2, field3 } = req;
    
    const result = await db.queryRow<Resource>`
      UPDATE resources
      SET 
        field1 = COALESCE(${field1}, field1),
        field2 = COALESCE(${field2}, field2),
        field3 = COALESCE(${field3}, field3),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    return result!;
  }
);
```

### 2. Conditional Query Pattern
```typescript
let query;

if (filter1 && filter2) {
  query = db.query`SELECT * FROM table WHERE col1 = ${filter1} AND col2 = ${filter2}`;
} else if (filter1) {
  query = db.query`SELECT * FROM table WHERE col1 = ${filter1}`;
} else {
  query = db.query`SELECT * FROM table`;
}

const results = [];
for await (const row of query) {
  results.push(row);
}
```

### 3. JSONB Field Parser
```typescript
function parseJsonField<T>(field: any): T {
  if (typeof field === 'string') {
    return JSON.parse(field);
  }
  return field as T;
}

// Usage:
const times = parseJsonField<string[]>(item.times_of_day);
const details = parseJsonField<ItemDetails>(item.details);
```

---

## Statistics

**Lines of Code:**
- Backend TypeScript: ~1,200 lines
- Frontend TypeScript: ~1,026 lines
- SQL Migration: ~45 lines
- Total: ~2,271 lines

**Files:**
- Created: 24 files
- Modified: 5 files
- Total: 29 files

**API Endpoints:** 14 endpoints

**Database Tables:** 3 tables (care_plans, care_plan_items, care_plan_completions)

**Presets:** 6 condition templates

**Bug Fixes:** 5 TypeScript errors resolved

---

## Next Steps (When Resuming)

### Phase 1: Minimal Care Plans MVP (Recommended)
1. **Restore backend only:**
   - `git checkout stash@{0} -- backend/care_plans/`
   - `git checkout stash@{0} -- backend/db/migrations/043_create_care_plans.up.sql`

2. **Create minimal frontend:**
   - Simple "Create Care Plan" form (no presets)
   - Basic item list (no tabs)
   - Today's tasks checklist only

3. **Deploy & Test:**
   - Staging first
   - Verify migration applies
   - Test APIs manually
   - Enable in UI after confirmation

4. **Gradual Enhancement:**
   - Add preset templates
   - Add tab navigation
   - Add stats dashboard
   - Add notifications

### Phase 2: Full Feature Restoration
1. Restore all stashed files
2. Test locally with `encore run`
3. Deploy to staging
4. QA testing with real users
5. Production rollout with monitoring

---

**END OF STASH DOCUMENTATION**
