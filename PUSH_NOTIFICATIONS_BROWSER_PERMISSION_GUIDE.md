# Push Notifications - Browser Permission Guide

## Problem
"Permission denied" error when trying to enable push notifications.

## Cause
Your browser has blocked notifications for this site. This happens when:
1. You previously clicked "Block" on the notification permission prompt
2. Your browser settings have notifications disabled globally
3. You're in incognito/private browsing mode

## Solution: Enable Notifications in Browser

### Google Chrome / Microsoft Edge
1. Click the **lock icon** (🔒) or **info icon** (ⓘ) in the address bar
2. Find **"Notifications"** in the dropdown
3. Change from "Block" to **"Allow"**
4. Refresh the page
5. Try toggling push notifications again

**Alternative - Chrome Settings:**
1. Go to `chrome://settings/content/notifications`
2. Find your site in the "Blocked" list
3. Click the **trash icon** to remove it
4. Refresh the page and try again

### Firefox
1. Click the **lock icon** (🔒) in the address bar
2. Click the arrow next to "Permissions"
3. Find **"Receive notifications"**
4. Change to **"Allow"**
5. Refresh the page
6. Try toggling push notifications again

**Alternative - Firefox Settings:**
1. Go to `about:preferences#privacy`
2. Scroll to "Permissions" → Click **"Settings"** next to Notifications
3. Find your site in the list
4. Change "Status" to **"Allow"**
5. Click "Save Changes"

### Safari (macOS)
1. **Safari menu** → **Settings for This Website**
2. Find **"Notifications"**
3. Change to **"Allow"**
4. Refresh the page
5. Try toggling push notifications again

**Alternative - Safari Preferences:**
1. **Safari menu** → **Settings** (or Preferences)
2. Go to **"Websites"** tab
3. Click **"Notifications"** in the left sidebar
4. Find your site and set to **"Allow"**

### Safari (iOS 16.4+)
1. Tap **"AA"** in the address bar
2. Tap **"Website Settings"**
3. Find **"Notifications"**
4. Set to **"Allow"**
5. Refresh the page

**Note:** Push notifications on iOS require iOS 16.4 or later.

## After Enabling Notifications

Once you've enabled notifications in your browser:

1. **Refresh the Emma Health App**
2. Go to **Notifications** view
3. **Toggle "Push Notifications" ON**
4. You should see a browser permission prompt - click **"Allow"**
5. Click **"Send Test Notification"** to verify it works
6. You should receive a test notification! 🎉

## Still Not Working?

### Check if Service Worker is Running
1. Open browser DevTools (F12 or Right-click → Inspect)
2. Go to **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
3. Click **"Service Workers"** in the left sidebar
4. You should see `/sw.js` listed and running
5. If not, refresh the page

### Clear Site Data and Try Again
1. Open browser DevTools (F12)
2. Go to **Application** tab → **Storage**
3. Click **"Clear site data"**
4. Refresh the page
5. Go through the setup process again

### Browser Compatibility
Push notifications are supported in:
- ✅ Chrome 50+ (Desktop & Android)
- ✅ Edge 17+ (Desktop & Android)
- ✅ Firefox 44+ (Desktop & Android)
- ✅ Safari 16+ (macOS 13+, iOS 16.4+)
- ✅ Opera 42+ (Desktop & Android)

❌ Not supported in:
- Incognito/Private browsing mode (most browsers)
- Older browser versions
- Some corporate/restricted networks

## Troubleshooting Checklist

- [ ] Notifications are allowed in browser settings
- [ ] Not in incognito/private mode
- [ ] Service worker is registered (check DevTools)
- [ ] VAPID keys are configured in Settings (backend)
- [ ] Page has been refreshed after enabling permissions
- [ ] Using a supported browser version

## Need More Help?

If you've followed all these steps and it's still not working:

1. Check browser console for error messages (F12 → Console tab)
2. Verify VAPID secrets are correctly added in Settings
3. Try a different browser
4. Check if notifications work on other websites (to rule out system-level blocks)

---

Once working, you'll receive friendly reminders from Emma for:
- 🌅 Morning check-ins
- 💊 Medication reminders
- 🌙 Evening reflections
- 😊 Mood check-ins
- 🍎 Nutrition logging
