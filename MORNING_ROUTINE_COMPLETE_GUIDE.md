# Morning Routine Feature - Complete Integration Guide

## Overview
Rebuilt morning routine system based on the evening routine pattern, with full integration to wellness journal, journey tracking, and milestone awards.

## Features

### 1. Template Selection System
Users can choose from 6 pre-built routine templates:

**The Energizer** ⚡ (15 min)
- Quick, high-energy start to boost mood
- Wake-up stretch, cold water splash, jumping jacks, power breakfast
- Color: Orange to Red gradient

**Mindful Start** 🧘 (20 min)
- Calm, centered beginning to the day
- Meditation, gratitude practice, gentle yoga, mindful tea
- Color: Purple to Blue gradient

**Productive Morning** 📋 (25 min)
- Organized, goal-focused start
- Review daily goals, quick email check, plan day, healthy breakfast
- Color: Blue to Cyan gradient

**Wellness Warrior** 💪 (30 min)
- Complete health-focused routine
- Hydration, full body stretch, vitamins, morning workout, green smoothie
- Color: Green to Teal gradient

**Gentle Wake-Up** ☀️ (10 min)
- Easy, relaxed morning
- Slow wake-up, light stretch, favorite music, simple breakfast
- Color: Yellow to Orange gradient

**Build Your Own** ✨ (Custom)
- Create personalized routine with Emma's guidance
- Opens conversational interface
- Color: Pink to Purple gradient

### 2. Daily Activity Tracking

**Interactive Checklist:**
- Large, clickable activity cards
- Visual feedback (green gradient when complete, empty circle when pending)
- Auto-saves to database on each toggle
- Progress counter shows X/Y completed
- Completion celebration with sparkles when all done

**Activity Details:**
- Activity icon and name
- Optional description
- Duration in minutes
- One-click toggle to complete/uncomplete

### 3. Stats Dashboard

**Four Key Metrics:**
- 🔥 **Current Streak**: Consecutive days with all activities complete
- 🎯 **Completion Rate**: Percentage of days completed (last 30 days)
- 📅 **Days Achieved**: Total completions out of 30 days
- 📈 **Longest Streak**: Personal best streak record

**Color-Coded Cards:**
- Orange/Red gradient for Current Streak (motivational fire icon)
- Blue/Cyan gradient for Completion Rate (target icon)
- Green/Teal gradient for Days Achieved (calendar icon)
- Purple/Pink gradient for Longest Streak (trending up icon)

### 4. Chat Integration

**"Chat with Emma" Button:**
- Opens full conversational interface within morning routine view
- Context-aware greeting based on history
- Morning-specific questions and guidance
- Custom routine builder for "Build Your Own" template
- Back button to return to routine view

**Conversational Features:**
- Sleep quality discussion
- Personalized habit suggestions
- Stretch guidance
- Routine preference questions
- Music recommendations
- Wake time scheduling

### 5. Backend Integration

**API Endpoints:**

`/morning_routine/templates` - GET
- Returns 6 pre-built routine templates
- Includes activities, duration, colors, icons

`/morning_routine/preference/create` - POST
- Creates or updates user's routine preference
- Stores routine name, activities, wake time, duration
- Auto-updates journey progress

`/morning_routine/preference/get` - GET
- Retrieves current routine preference
- Returns null if no preference set

`/morning_routine/completion/log` - POST
- Logs daily activity completion
- Updates or creates today's record
- Auto-creates wellness journal entry when all complete
- Awards milestones

`/morning_routine/stats` - POST
- Calculates streaks and completion rates
- Returns last 30 days of data
- Computes average mood and energy

`/morning_routine/today/:user_id` - GET
- Retrieves today's completion record
- Returns completed activities list

`/morning_routine/history/:user_id` - GET
- Retrieves historical completion records
- Supports date range filtering

**Database Tables:**

`morning_routine_preferences`
- Stores user's saved routine configuration
- Fields: routine_name, activities (JSONB), wake_time, duration_minutes
- One record per user

`morning_routine_completions`
- Daily completion tracking
- Fields: completion_date, activities_completed (JSONB), all_completed, mood_rating, energy_level
- Unique constraint per user per day

### 6. Wellness Journal Auto-Creation

**Automatic Entry Generation:**
When user completes all activities:
- Creates wellness journal entry with "Morning Routine Completed" title
- Lists all completed activities
- Includes mood rating if provided
- Includes energy level if provided
- Tags: ["morning", "routine", "completed"]
- Source type: "morning_routine"
- Auto-links to relevant wellness chapters

**Auto-Linking Logic:**
- Morning routine entries link to "Improve Sleep Quality" chapter
- Morning routine entries link to "Increase Energy Through Movement" chapter
- Uses intelligent matching algorithm from wellness_journal/link_entry_to_chapter.ts

### 7. Journey Progress Tracking

**Setup Progress Updates:**
Creating a routine preference marks:
- `morning_routine_completed = true` in wellness_journey_setup

Completing all activities for the first time:
- Awards "Morning Routine Master" milestone badge
- Updates journey completion percentage
- Triggers confetti celebration

### 8. User Flow

**First Time User:**
1. Navigate to Morning Routine view
2. Template selection screen auto-displays
3. Click any template card
4. If "Build Your Own", chat opens
5. Otherwise, routine saves immediately
6. Main routine view loads with empty checklist

**Daily Use:**
1. Open Morning Routine view
2. See stats dashboard at top
3. View today's activity checklist
4. Click each activity to mark complete
5. Get celebration when all done
6. Journal entry auto-created

**Changing Routine:**
1. Click "Change Routine" button
2. Template selection screen appears
3. Select new template
4. Routine updates immediately
5. Historical stats carry over

**Chat Workflow:**
1. Click "Chat with Emma" button anytime
2. Conversational interface opens
3. Discuss morning preferences
4. Get personalized guidance
5. Click "Back to Routine" to return

### 9. Technical Implementation

**State Management:**
- `templates`: Array of RoutineTemplate
- `preference`: MorningRoutinePreference | null
- `stats`: RoutineStats | null
- `todayCompleted`: string[] (activity IDs)
- `loading`: boolean
- `showTemplates`: boolean
- `showChat`: boolean

**Loading Sequence:**
1. Component mounts, triggers loadRoutineData()
2. Parallel API calls:
   - Get templates
   - Get user preference
   - Get 30-day stats
   - Get today's completion
3. Parse today's completed activities from JSON
4. If no preference, show templates
5. Otherwise, show main routine view

**Activity Toggle Logic:**
```typescript
1. Check if already in todayCompleted
2. Add or remove from array
3. Calculate if all activities complete
4. Call logRoutineCompletion API
5. Reload stats to update streaks
6. Show toast if all complete
```

**Streak Calculation:**
- Checks consecutive days with all_completed = true
- Breaks if any day is missed
- Current streak only counts if today or yesterday completed
- Longest streak tracked separately

### 10. UI/UX Highlights

**Visual Design:**
- Consistent color gradients across all cards
- Soft white backdrop with blur effect
- Rounded corners (2xl and 3xl radius)
- Shadow effects for depth
- Hover states with border color transitions
- Loading spinner with brand color

**Responsive Layout:**
- Template grid: 1 column mobile, 2 tablet, 3 desktop
- Stats grid: 2 columns mobile, 4 desktop
- Activity checklist stacks vertically
- Chat integration full-width

**Animations:**
- Smooth transitions on hover
- CheckCircle2 icon toggle
- Sparkles on completion celebration
- RefreshCw spin on loading

**Accessibility:**
- Large clickable targets
- Clear visual states (completed vs pending)
- Descriptive button labels
- Semantic HTML structure

### 11. Integration Points

**With Wellness Journal:**
- Auto-creates entry on routine completion
- Links to sleep/energy chapters
- Stores source_id reference

**With Journey Setup:**
- Updates morning_routine_completed flag
- Contributes to overall setup percentage
- Enables milestone awards

**With Conversation System:**
- Seamless chat integration
- Context-aware messaging
- Preserves conversation history

**With Profile System:**
- Stores wake_time preference
- Tracks interaction count
- Enables personalization

### 12. Future Enhancement Ideas

- **Custom Activity Builder**: Drag-and-drop interface
- **Smart Notifications**: Wake-time based reminders
- **Voice Guidance**: Audio-guided routines
- **Social Sharing**: Share routine with friends
- **Routine Library**: Browse community routines
- **Weather Integration**: Adjust based on forecast
- **Photo Journaling**: Capture morning moments
- **Health App Sync**: Apple Health, Google Fit
- **Habit Stacking**: Link routines to triggers
- **Weekly Reports**: Progress summary emails

## Code Files Reference

**Frontend:**
- `/frontend/components/views/MorningRoutineView.tsx` - Main component

**Backend:**
- `/backend/morning/get_routine_templates.ts` - Template data
- `/backend/morning/create_routine_preference.ts` - Save preference
- `/backend/morning/get_routine_preference.ts` - Load preference
- `/backend/morning/log_routine_completion.ts` - Track completion
- `/backend/morning/get_routine_stats.ts` - Calculate streaks
- `/backend/morning/get_today_completion.ts` - Today's data
- `/backend/morning/get_routine_history.ts` - Historical data
- `/backend/morning/routine_types.ts` - TypeScript types
- `/backend/wellness_journal/auto_create.ts` - Journal integration
- `/backend/journey/update_progress.ts` - Setup tracking

**Database:**
- Migration 026: `morning_routine_preferences` and `morning_routine_completions` tables

## Testing Checklist

- [ ] Template selection displays correctly
- [ ] Each template can be selected
- [ ] "Build Your Own" opens chat
- [ ] Routine preference saves to database
- [ ] Main view shows selected routine
- [ ] Activity checklist loads today's data
- [ ] Toggling activity updates database
- [ ] Completion celebration appears when all done
- [ ] Stats dashboard shows accurate data
- [ ] Current streak calculates correctly
- [ ] Longest streak persists
- [ ] Completion rate percentage accurate
- [ ] "Change Routine" returns to templates
- [ ] "Chat with Emma" opens conversational interface
- [ ] Back button returns from chat
- [ ] Wellness journal entry auto-created
- [ ] Journey progress updated
- [ ] Milestone awarded on first completion
- [ ] Historical data queryable
