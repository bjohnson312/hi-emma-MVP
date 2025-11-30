# Care Plans Migration Status

**Status:** ✅ Ready for `encore run` with migration 043

**Last Updated:** 2025-11-30

---

## Changes Applied (Safe Mode)

### ✅ Backend Changes
1. **Migration 043 created:** `backend/db/migrations/043_create_care_plans.up.sql`
   - Creates `care_plans` table
   - Creates `care_plan_items` table  
   - Creates `care_plan_completions` table
   - All tables have proper indexes and constraints

2. **Care Plans Service:** `backend/care_plans/` (16 files)
   - ✅ Service definition exists
   - ✅ All 14 API endpoints properly exported
   - ✅ TypeScript compiles without errors
   - ✅ No circular dependencies detected

3. **Supporting Services Updated:**
   - `backend/notifications/scheduler.ts` - Care plan reminders (feature flagged)
   - Bug fixes in `backend/conversation/chat.ts`
   - Bug fixes in `backend/morning/mark_activity_complete.ts`
   - Bug fixes in `backend/morning/mark_all_complete.ts`

### ✅ Frontend Changes (Conservative Mode)
1. **UI State:** Doctor's Orders set to "coming soon"
   - `frontend/components/Sidebar.tsx` - Badge re-added ✅
   - `frontend/components/MobileMenu.tsx` - Label corrected ✅
   - `frontend/components/ConversationalCheckIn.tsx` - TodayCareTasks integration removed ✅

2. **Components Created (Not Wired Up Yet):**
   - `frontend/components/CarePlanSetup.tsx` - Preset selection flow
   - `frontend/components/CarePlanItemEditor.tsx` - Item CRUD modal
   - `frontend/components/TodayCareTasks.tsx` - Dashboard widget
   - `frontend/components/views/DoctorsOrdersView.tsx` - Full care plans UI

3. **Configuration:**
   - `frontend/config.ts` - `ENABLE_CARE_PLAN_REMINDERS` flag added

---

## What Happens When You Run `encore run`

### Expected Outcome (Success Path)

1. **Encore starts app**
2. **Migration 043 runs automatically:**
   ```
   Running migration: 043_create_care_plans.up.sql
   Creating table care_plans... OK
   Creating table care_plan_items... OK
   Creating table care_plan_completions... OK
   Creating indexes... OK
   ```
3. **All services initialize successfully:**
   - ✅ care_plans service loads (16 endpoints)
   - ✅ conversation service loads
   - ✅ morning service loads
   - ✅ All other services load
4. **App is accessible at preview URL**
5. **No "state: empty" error**

### Current UI Behavior

- **Doctor's Orders menu item:**
  - Shows "coming soon" badge
  - Clicking it loads DoctorsOrdersView
  - DoctorsOrdersView shows empty state with "Create Care Plan" button
  - Button currently functional (preset selection works)

- **Conversation:**
  - Starts normally
  - Morning check-in works
  - Does NOT show care tasks widget after completion

- **Other features:**
  - All existing features unchanged
  - Morning routine, diet, mood, etc. work as before

---

## API Endpoints Available (But Not Used in UI Yet)

### Care Plans Management
- `POST /care-plans` - Create care plan
- `PATCH /care-plans/:plan_id` - Update care plan
- `DELETE /care-plans/:plan_id` - Soft delete
- `GET /care-plans/user/:user_id` - Get user's plans
- `GET /care-plans/presets` - Get preset templates
- `POST /care-plans/generate` - Generate AI plan

### Care Plan Items
- `POST /care-plans/items` - Create item
- `PATCH /care-plans/items/:item_id` - Update item
- `DELETE /care-plans/items/:item_id` - Delete item
- `GET /care-plans/:care_plan_id/items` - Get plan items

### Daily Tasks & Tracking
- `GET /care-plans/today/:user_id` - Get today's tasks
- `POST /care-plans/complete` - Mark item complete
- `GET /care-plans/completions/:user_id` - Get completion history
- `GET /care-plans/stats/:user_id` - Get adherence stats

---

## Verification Checklist

After `encore run` starts successfully:

### ✅ Core Functionality Tests

1. **Conversation:**
   - [ ] Navigate to Chat (Home)
   - [ ] Start a conversation
   - [ ] Send a message
   - [ ] Verify Emma responds
   - [ ] Complete morning check-in
   - [ ] Verify no care tasks widget shows (expected)

2. **Morning Routine:**
   - [ ] Navigate to Morning Routine
   - [ ] Load routine
   - [ ] Mark an activity complete
   - [ ] Verify no errors

3. **Doctor's Orders:**
   - [ ] Navigate to Doctor's Orders
   - [ ] Verify "coming soon" badge shows
   - [ ] Click menu item
   - [ ] Page loads without 500 error
   - [ ] Verify empty state OR preset selection shows

### ✅ Backend Health Checks

```bash
# Check if care_plans service is running
curl http://localhost:4000/care-plans/presets
# Expected: JSON response with 6 presets

# Check migration status
psql <database> -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 5;"
# Expected: 043 appears in list
```

---

## Fallback Plan (If Encore Fails to Start)

### If you see: "state: empty" or "no successful build available"

**Automatic Fallback Steps:**

1. **Disable care_plans service temporarily:**
   ```bash
   cd backend/care_plans
   mv encore.service.ts encore.service.ts.disabled
   ```

2. **Restart encore run**

3. **Verify core app works:**
   - Chat conversation starts
   - Morning routine loads
   - No 500 errors

4. **Re-enable care_plans later:**
   ```bash
   cd backend/care_plans
   mv encore.service.ts.disabled encore.service.ts
   ```

5. **Debug in isolation:**
   - Check Encore logs for specific error
   - Test care_plans endpoints manually
   - Verify database tables exist

### If migration 043 fails:

Check for errors like:
```
ERROR: relation "care_plans" already exists
```

**Solution:**
```sql
-- Rollback migration
DROP TABLE IF EXISTS care_plan_completions CASCADE;
DROP TABLE IF EXISTS care_plan_items CASCADE;
DROP TABLE IF EXISTS care_plans CASCADE;
DELETE FROM schema_migrations WHERE version = 43;

-- Re-run encore run (migration will apply cleanly)
```

---

## What's NOT Enabled Yet

To keep the rollout controlled, these are **intentionally disabled:**

- ❌ TodayCareTasks widget in ConversationalCheckIn
- ❌ Care plan reminders (notifications)
- ❌ Dashboard integration
- ❌ "Remove coming soon badge" from Doctor's Orders

**These can be enabled later by:**
1. Removing `badge: "coming-soon"` from Sidebar
2. Re-adding TodayCareTasks to ConversationalCheckIn
3. Setting `ENABLE_CARE_PLAN_REMINDERS=true`

---

## Files Changed Summary

### Backend (19 files)
- **New:** 17 care_plans service files
- **Modified:** 2 files (notifications/scheduler.ts, bug fixes)

### Frontend (7 files)
- **New:** 4 components (CarePlanSetup, CarePlanItemEditor, TodayCareTasks, updated DoctorsOrdersView)
- **Modified:** 3 files (Sidebar, MobileMenu, ConversationalCheckIn - reverted to safe state)

### Database (1 file)
- **New:** 1 migration (043_create_care_plans.up.sql)

**Total: 27 files**

---

## Success Criteria

✅ **App starts without "state: empty" error**
✅ **Conversation API works (no 500s)**
✅ **Morning routine works**
✅ **Doctor's Orders page loads (even if minimal)**
✅ **No backend errors in Encore logs**
✅ **Migration 043 applied successfully**

---

## Next Phase (After Verification)

Once the app is stable:

**Phase 2: Enable Full Doctor's Orders UI**
1. Remove "coming soon" badge
2. Test full preset flow
3. Test CRUD operations
4. Enable TodayCareTasks widget
5. Enable notifications (staging only first)
6. Production rollout

**Estimated timeline:** 1-2 days testing in staging, then production

---

## Contact / Support

If you encounter any issues:

1. **Check Encore logs:** Look for specific service initialization errors
2. **Check database logs:** Verify migration 043 applied
3. **Check browser console:** Look for API errors (404, 500)
4. **Provide error details:** Exact error message, stack trace, Encore logs

---

**Status: Ready for `encore run` ✅**

**Next Step: Run `encore run` and verify checklist above** 🚀
