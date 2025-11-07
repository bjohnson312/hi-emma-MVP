# Wellness Journal - Complete Feature Guide

## Overview
The Wellness Journal is a comprehensive feature that automatically captures and organizes all wellness activities into a timeline-based journal. It provides insights, trends analysis, and daily summaries powered by AI.

## Features Implemented

### ✅ Core Functionality

#### 1. **Automatic Journal Entries**
All wellness activities automatically create journal entries:
- **Morning Routine**: Sleep quality, selected activities, and notes
- **Evening Routine**: Wind-down activities, screen time, bedtime
- **Mood Check-ins**: Mood ratings, energy levels, stress levels, triggers
- **Nutrition Logs**: Meal types, descriptions, water intake, energy levels
- **Medication Tracking**: Medication taken, dosage, timing
- **Conversations**: Key conversation insights and reflections

#### 2. **Manual Entry Creation**
Users can add custom journal entries with:
- Title and content
- Custom tags for organization
- Timestamps and metadata

#### 3. **AI-Powered Daily Summaries**
- Generates comprehensive daily wellness summaries using OpenAI GPT-4o-mini
- Summarizes all activities from the day
- Includes mood, energy, sleep patterns, nutrition, medications, and conversations
- Warm, personalized tone as if written by Emma
- Automatically calculates average mood and energy levels

#### 4. **Trend Analysis**
Analyzes wellness patterns over customizable time periods (default 30 days):
- **Sleep Trends**: Average quality, improvement patterns, recommendations
- **Mood Trends**: Average ratings, trending direction, best times
- **Energy Trends**: Average levels, improvement patterns, peak hours
- **Activity Patterns**: Most consistent activities, completion rates
- Generates automated insights and personalized recommendations

#### 5. **Statistics Dashboard**
- Total entry count
- Streak tracking (consecutive days with entries)
- Entries by type (daily summary, events, insights, milestones)
- Average mood rating
- Average energy level
- Most common tags
- Last entry date

#### 6. **Filtering & Organization**
- Filter by entry type: All, Daily Summary, Event, Insight, Milestone
- Chronological timeline view grouped by date
- Visual indicators for entry types
- Tag-based organization

### 📊 Entry Types

1. **Daily Summary** (AI-Generated)
   - Comprehensive overview of the day
   - Aggregates all wellness data
   - Purple gradient styling with sparkle icon

2. **Event** (Auto or Manual)
   - Individual wellness activities
   - Morning/evening routines, mood checks, meals, medications
   - Green gradient styling with book icon

3. **Insight** (AI-Generated from Trends)
   - Pattern recognition and recommendations
   - Sleep improvements, mood patterns, energy levels
   - Blue gradient styling with trending icon

4. **Milestone** (System-Generated)
   - Achievement tracking
   - Consistency streaks, progress markers
   - Pink gradient styling with heart icon

### 🔌 API Endpoints

#### `POST /wellness_journal/entries`
Get journal entries with optional filters
```typescript
{
  user_id: string;
  start_date?: Date;
  end_date?: Date;
  entry_type?: "daily_summary" | "milestone" | "insight" | "event";
  tags?: string[];
  limit?: number; // default: 50
}
```

#### `POST /wellness_journal/stats`
Get journal statistics
```typescript
{
  user_id: string;
  start_date?: Date;
  end_date?: Date;
}
```

#### `POST /wellness_journal/add-manual`
Add a manual journal entry
```typescript
{
  user_id: string;
  entry_date?: Date;
  entry_type: "event" | "insight" | "milestone";
  title: string;
  content: string;
  mood_rating?: number; // 1-10
  energy_level?: number; // 1-5
  sleep_quality?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}
```

#### `POST /wellness_journal/add-from-conversation`
Create entry from conversation
```typescript
{
  user_id: string;
  conversation_text: string;
  session_type?: string;
  title?: string;
  tags?: string[];
}
```

#### `POST /wellness_journal/generate-daily-summary`
Generate AI summary for a specific date
```typescript
{
  user_id: string;
  date?: Date; // defaults to today
}
```

#### `POST /wellness_journal/analyze`
Analyze wellness trends
```typescript
{
  user_id: string;
  days?: number; // default: 30
}
```

### 🗄️ Database Schema

**Table: `wellness_journal_entries`**
```sql
- id (BIGSERIAL PRIMARY KEY)
- user_id (TEXT NOT NULL)
- entry_date (DATE NOT NULL DEFAULT CURRENT_DATE)
- entry_type (TEXT NOT NULL CHECK)
- title (TEXT NOT NULL)
- content (TEXT NOT NULL)
- mood_rating (INTEGER CHECK 1-10)
- energy_level (INTEGER CHECK 1-5)
- sleep_quality (TEXT)
- tags (TEXT[])
- metadata (JSONB)
- source_type (TEXT)
- source_id (BIGINT)
- ai_generated (BOOLEAN NOT NULL DEFAULT FALSE)
- created_at (TIMESTAMP NOT NULL DEFAULT NOW())
- updated_at (TIMESTAMP NOT NULL DEFAULT NOW())
```

**Indexes:**
- `idx_wellness_journal_user_date` - user_id, entry_date DESC
- `idx_wellness_journal_type` - user_id, entry_type
- `idx_wellness_journal_tags` - GIN index on tags
- `idx_wellness_journal_created` - user_id, created_at DESC

### 🎨 Frontend Features

**Location:** `/frontend/components/views/WellnessJournalView.tsx`

**UI Components:**
1. **Header Section**
   - Stats overview cards (total entries, streak, avg mood, avg energy, insights)
   - Action buttons (Add Entry, Analyze Trends, Generate Summary)
   - Filter bar (All, Daily Summary, Event, Insight)

2. **Manual Entry Form**
   - Title input
   - Content textarea
   - Tags input (comma-separated)
   - Create button

3. **Timeline View**
   - Grouped by date
   - Visual timeline with connecting line
   - Color-coded entry cards
   - Icons for each entry type
   - Tags and metadata display
   - Mood/energy/sleep indicators

4. **Loading States**
   - Skeleton loaders
   - Loading spinners
   - Disabled states during operations

### 🔄 Auto-Creation Integration

All wellness tracking features automatically create journal entries:

**Morning Routine** → `autoCreateMorningEntry()`
- Called after morning check-in completion
- Records sleep quality and selected activity

**Evening Routine** → `autoCreateEveningEntry()`
- Called after evening routine log
- Records wind-down activities and bedtime

**Mood Tracking** → `autoCreateMoodEntry()`
- Called after mood check-in
- Records mood, energy, stress, triggers

**Nutrition Tracking** → `autoCreateNutritionEntry()`
- Called after meal log
- Records meal type, description, water intake

**Medication Tracking** → `autoCreateMedicationEntry()`
- Called after medication log
- Records medication name and dosage

**Conversations** → `autoCreateConversationInsight()` (available)
- Can be called to capture conversation insights
- AI-generated summaries of meaningful conversations

### 🤖 AI Integration

**OpenAI GPT-4o-mini** is used for:
1. **Daily Summaries**
   - Warm, personalized tone
   - 2-3 paragraph summaries
   - Focuses on patterns, highlights, and encouragement
   - Max 300 tokens

2. **Future: Conversation Insights** (function available)
   - Extract meaningful insights from conversations
   - Identify keywords and themes
   - Generate personalized reflections

### 🔮 Future Enhancements (Available but Not Yet UI-Integrated)

1. **Cron Job for Daily Summaries**
   - `daily_summary_cron.ts` exists but is commented out
   - Can be enabled to auto-generate summaries daily at 1 AM
   - Skips users with no activity or existing summaries

2. **Milestone Entries**
   - Entry type exists but not yet auto-generated
   - Can track achievements, streaks, significant progress

3. **Conversation Insights**
   - `autoCreateConversationInsight()` function ready
   - Can extract and store insights from conversations
   - Needs integration with conversation tracking

### 📝 Usage Examples

#### Adding a Manual Entry
```typescript
await backend.wellness_journal.addManualEntry({
  user_id: "user123",
  entry_type: "event",
  title: "Afternoon Walk",
  content: "Went for a 30-minute walk in the park. Felt refreshing!",
  tags: ["exercise", "outdoor", "mindfulness"],
  energy_level: 4
});
```

#### Generating Daily Summary
```typescript
const result = await backend.wellness_journal.generateDailySummary({
  user_id: "user123",
  date: new Date()
});
// Returns: { summary: WellnessJournalEntry, data: DailySummaryData }
```

#### Analyzing Trends
```typescript
const analysis = await backend.wellness_journal.analyzeTrends({
  user_id: "user123",
  days: 30
});
// Returns trend analysis with sleep, mood, energy patterns
```

#### Getting Entries
```typescript
const entries = await backend.wellness_journal.getJournalEntries({
  user_id: "user123",
  entry_type: "daily_summary",
  limit: 10
});
// Returns: { entries: [...], total_count: number }
```

### 🎯 Best Practices

1. **Daily Summaries**
   - Generate at end of day or beginning of next day
   - Ensure user has activity before generating
   - Cache summaries to avoid regeneration

2. **Trend Analysis**
   - Run weekly or monthly for best insights
   - Minimum 7 days of data for meaningful trends
   - Generate insights automatically creates insight entries

3. **Manual Entries**
   - Encourage users to add reflections
   - Use descriptive titles and tags
   - Include mood/energy when relevant

4. **Performance**
   - Paginate large result sets
   - Use date range filters for better performance
   - Index on frequently queried fields

### ✨ Key Benefits

- **Automatic**: No manual effort required for most entries
- **Comprehensive**: Captures all aspects of wellness
- **Intelligent**: AI-powered summaries and insights
- **Visual**: Beautiful timeline interface
- **Actionable**: Trend analysis provides recommendations
- **Private**: User-specific, secure data storage
- **Flexible**: Supports both auto and manual entries

## Testing the Wellness Journal

1. **Complete a morning routine** → Check for auto-created entry
2. **Log a mood check-in** → Verify entry appears in timeline
3. **Add a manual entry** → Use the "Add Entry" button
4. **Generate daily summary** → Click "Generate Summary" button
5. **Analyze trends** → Click "Analyze Trends" after 7+ days of data
6. **View statistics** → Check the stats cards at the top
7. **Filter entries** → Use filter buttons to see different types
8. **Check streak** → Complete entries on consecutive days

## Conclusion

The Wellness Journal is **fully functional** and ready to use! All backend APIs are working, database schema is in place, auto-creation integrations are active, and the frontend UI is complete with all interactive features.

Users can now:
✅ View their comprehensive wellness timeline
✅ Add manual entries
✅ Generate AI summaries
✅ Analyze wellness trends
✅ Track their progress with statistics
✅ Automatically capture all wellness activities
