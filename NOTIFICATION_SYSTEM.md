# Medication Notification System

## Overview

This notification system automatically reminds users to take their medications based on the `time_of_day` field in their Doctor's Orders. It supports both browser push notifications and SMS via Twilio.

## Features

- ✅ Automatic medication reminders based on Doctor's Orders
- ✅ Browser push notifications
- ✅ SMS notifications via Twilio
- ✅ User-configurable notification preferences
- ✅ Morning check-in reminders
- ✅ Evening reflection reminders
- ✅ Flexible notification scheduling with 15-minute tolerance

## Architecture

### Backend Components

#### 1. Database Tables

**notification_preferences**
- Stores user notification settings
- Fields: morning/evening check-in times, medication reminders enabled/disabled, notification method (browser/sms/both), phone number, timezone

**notification_queue**
- Queues notifications for delivery
- Tracks delivery status (pending/sent/failed)
- Stores metadata for each notification

#### 2. Cron Jobs

**check-medication-reminders** (runs every 15 minutes)
- Queries active Doctor's Orders
- Checks if current time matches any medication times
- Creates notification queue entries
- Prevents duplicate notifications for the same medication/time/day

**process-pending-notifications** (runs every 5 minutes)
- Processes pending notifications from the queue
- Sends SMS notifications via Twilio
- Marks notifications as sent or failed

#### 3. API Endpoints

**GET /notifications/preferences/:user_id**
- Retrieves user notification preferences
- Auto-creates default preferences if none exist

**PUT /notifications/preferences**
- Updates user notification preferences
- Supports all preference fields

**POST /notifications/push-subscription**
- Registers browser push subscription for a user

**POST /notifications/send**
- Sends immediate notification to a user
- Respects user's notification method preference

**GET /notifications/pending/:user_id**
- Retrieves pending browser notifications
- Automatically marks them as sent when fetched

### Frontend Components

#### 1. NotificationsView
- User interface for managing notification preferences
- Toggle switches for each notification type
- Time pickers for morning/evening reminders
- Notification method selector (browser/sms/both)
- Phone number input for SMS notifications

#### 2. Hooks

**useNotifications**
- Manages browser notification permissions
- Handles push subscription registration
- Provides notification display function

**useNotificationPolling**
- Polls backend every 30 seconds for pending notifications
- Displays browser notifications when received
- Integrated into main App component

## Setup Instructions

### 1. Twilio Configuration

To enable SMS notifications, configure the following secrets in the Leap Settings:

- **TwilioAccountSid**: Your Twilio Account SID
- **TwilioAuthToken**: Your Twilio Auth Token
- **TwilioPhoneNumber**: Your Twilio phone number (format: +1234567890)

### 2. Browser Notifications

Users need to:
1. Go to Notifications view
2. Select "Browser Only" or "Both" as notification method
3. Click "Enable Browser Notifications" button
4. Accept the browser permission prompt

### 3. SMS Notifications

Users need to:
1. Go to Notifications view
2. Select "SMS Only" or "Both" as notification method
3. Enter their phone number with country code (e.g., +1234567890)
4. Click "Save Preferences"

## How It Works

### Medication Reminders

1. User creates a Doctor's Order with medication details and times (e.g., ["08:00", "20:00"])
2. Every 15 minutes, the `check-medication-reminders` cron job runs
3. For each user with medication reminders enabled:
   - Fetches active Doctor's Orders
   - Checks if current time matches any medication time (±15 minute tolerance)
   - Creates notification queue entries if not already sent today
4. Every 5 minutes, the `process-pending-notifications` cron job:
   - Fetches pending notifications
   - Sends SMS notifications via Twilio (for sms/both methods)
   - Marks browser notifications as pending (to be fetched by frontend)
5. Frontend polls every 30 seconds for pending browser notifications
6. Browser notifications are displayed immediately when received

### Notification Flow

```
Doctor's Order Created (time_of_day: ["08:00", "20:00"])
           ↓
Cron Job (every 15 min) checks if it's medication time
           ↓
Creates notification in queue (if within ±15 min window)
           ↓
     ┌─────┴─────┐
     ↓           ↓
  Browser      SMS
     ↓           ↓
  Polling    Twilio API
     ↓           ↓
  Display    Delivered
```

## Customization

### Adding New Notification Types

1. Add field to `notification_preferences` table
2. Update `NotificationPreferences` type in `/backend/notifications/types.ts`
3. Create cron job or trigger for the notification
4. Add UI toggle in `NotificationsView.tsx`

### Adjusting Notification Timing

- **Medication check frequency**: Edit schedule in `check-medication-reminders` cron job (currently `*/15 * * * *`)
- **Notification processing**: Edit schedule in `process-pending-notifications` cron job (currently `*/5 * * * *`)
- **Frontend polling**: Edit interval in `useNotificationPolling.ts` (currently 30000ms)

### Time Tolerance

The system checks if the current time is within ±15 minutes of the scheduled medication time. This can be adjusted in `/backend/notifications/scheduler.ts`:

```typescript
if (currentTime === reminderTime || 
    (parseInt(currentTime.split(':')[0]) === parseInt(hours) && 
     Math.abs(parseInt(currentTime.split(':')[1]) - parseInt(minutes)) <= 15))
```

## Troubleshooting

### SMS Not Sending

- Verify Twilio credentials are set in Settings
- Check phone number format includes country code
- Review `notification_queue` table for failed notifications and error messages

### Browser Notifications Not Appearing

- Ensure user granted browser notification permission
- Check if service worker is registered
- Verify notification polling is enabled
- Look for errors in browser console

### Duplicate Notifications

- Check `notification_queue` for duplicate entries
- Verify the duplicate prevention logic in `check-medication-reminders`
- Ensure cron jobs aren't running multiple instances

## Database Schema

See `/backend/db/migrations/005_create_notification_preferences.up.sql` for the complete schema.

## API Reference

All endpoints are under the `/notifications` service:

- `GET /notifications/preferences/:user_id` - Get user preferences
- `PUT /notifications/preferences` - Update user preferences
- `POST /notifications/push-subscription` - Register push subscription
- `POST /notifications/send` - Send immediate notification
- `GET /notifications/pending/:user_id` - Get pending notifications
