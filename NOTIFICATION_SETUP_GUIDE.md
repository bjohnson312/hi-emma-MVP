# Notification System Setup Guide

## Quick Start

The medication notification system is now fully implemented and ready to use. Follow these steps to get started:

## 1. Configure Twilio (For SMS Notifications)

To enable SMS notifications, you need to set up Twilio credentials:

1. **Open Settings** in the sidebar
2. **Add the following secrets:**
   - `TwilioAccountSid` - Your Twilio Account SID
   - `TwilioAuthToken` - Your Twilio Auth Token  
   - `TwilioPhoneNumber` - Your Twilio phone number (format: +1234567890)

> **Note:** If you only want browser notifications, you can skip this step.

## 2. Set Up Notification Preferences

1. **Navigate to Notifications** in the sidebar
2. **Choose your notification method:**
   - **Browser Only** - Receive notifications in the browser
   - **SMS Only** - Receive text messages
   - **Both** - Get notifications via both methods

3. **If using SMS:**
   - Enter your phone number with country code (e.g., +1234567890)

4. **Configure reminder times:**
   - Set your preferred morning check-in time
   - Set your preferred evening reflection time
   - Toggle medication reminders on/off

5. **Click "Save Preferences"**

## 3. Enable Browser Notifications (Optional)

If you selected "Browser Only" or "Both":

1. Click **"Enable Browser Notifications"** button
2. Accept the permission prompt in your browser
3. You'll now receive browser notifications

## 4. Add Your Medications

1. **Go to Doctor's Orders** in the sidebar
2. **Add a medication** with:
   - Medication name
   - Dosage
   - Frequency
   - **Times of day** (e.g., 8:00 AM, 8:00 PM)
   - Start date (and optional end date)

3. The system will automatically send reminders at the specified times!

## How Medication Reminders Work

- Reminders are checked **every 15 minutes**
- Notifications are sent within **±15 minutes** of the scheduled time
- You'll receive **one notification per medication per scheduled time**
- Works with both browser push notifications and SMS

## Example Usage

**Scenario:** You take Vitamin D at 8:00 AM and a prescription medication at 8:00 PM.

1. Add a Doctor's Order for Vitamin D:
   - Medication: "Vitamin D"
   - Dosage: "1000 IU"
   - Times: ["08:00"]

2. Add a Doctor's Order for your prescription:
   - Medication: "Lisinopril"
   - Dosage: "10mg"
   - Times: ["20:00"]

3. You'll automatically receive:
   - A reminder at ~8:00 AM for Vitamin D
   - A reminder at ~8:00 PM for Lisinopril

## Notification Types

The system supports three types of reminders:

1. **Morning Check-In** - Daily reminder to complete your morning routine
2. **Medication Reminders** - Based on your Doctor's Orders schedule
3. **Evening Reflection** - Daily reminder to log your evening routine

Each can be toggled on/off independently in the Notifications view.

## Troubleshooting

### Not receiving SMS notifications?
- Verify Twilio credentials in Settings
- Check that your phone number is correct (with country code)
- Make sure notification method is set to "SMS Only" or "Both"

### Not receiving browser notifications?
- Click "Enable Browser Notifications" and accept the permission
- Check that notification method is set to "Browser Only" or "Both"
- Make sure your browser allows notifications for this site

### Medication reminders not working?
- Verify the medication is marked as "active" in Doctor's Orders
- Check that the start date is today or earlier
- Ensure medication reminders are enabled in Notifications
- Verify the times are in 24-hour format (e.g., "20:00" not "8:00 PM")

## Advanced Features

### Multiple Medications at Same Time
You can add multiple medications with the same time - each will get its own notification.

### Timezone Support
Set your timezone in notification preferences to ensure accurate timing.

### Notification History
View past notifications in the notification queue database table.

## Support

For detailed technical documentation, see `NOTIFICATION_SYSTEM.md`.
