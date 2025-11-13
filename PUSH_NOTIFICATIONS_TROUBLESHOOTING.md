# Push Notifications Troubleshooting Steps

## Step 1: Check Browser Console

1. **Open Browser DevTools**
   - Press **F12** or Right-click → **Inspect**
   - Click the **Console** tab

2. **Look for logs** when you toggle push notifications:
   ```
   Current notification permission: [granted/denied/default]
   Requesting notification permission...
   Permission result: [granted/denied]
   Waiting for service worker...
   Service worker ready: ...
   Fetching VAPID public key...
   ```

3. **Common errors and what they mean:**

   **Error: "Push notifications are not configured"**
   - **Cause:** VAPID keys are missing from backend
   - **Solution:** Add VAPID secrets (see `EMMA_PUSH_NOTIFICATION_SECRETS.md`)

   **Error: "Permission denied"**
   - **Cause:** Browser is blocking notifications
   - **Solution:** Follow browser permission guide below

   **Error: "Service worker not ready"**
   - **Cause:** Service worker failed to register
   - **Solution:** Check Application tab in DevTools

## Step 2: Verify Service Worker

1. **Open DevTools** (F12)
2. Go to **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
3. Click **"Service Workers"** in left sidebar
4. You should see:
   - **Status:** Activated and running
   - **Source:** `/sw.js`
   - **Scope:** Your site URL

**If service worker is missing or stopped:**
1. Refresh the page
2. Check Console tab for registration errors
3. Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## Step 3: Reset Browser Permissions

### Chrome/Edge
1. Click **lock icon** 🔒 in address bar
2. Click **"Site settings"**
3. Find **"Notifications"** → Set to **"Ask (default)"**
4. Refresh the page
5. Try enabling push notifications again
6. Click **"Allow"** when prompted

### Firefox
1. Click **lock icon** 🔒
2. Click **"Clear permissions and cookies"**
3. Refresh the page
4. Try enabling push notifications again
5. Click **"Allow"** when prompted

### Safari
1. **Safari menu** → **Settings for This Website**
2. **Notifications** → **"Ask"** or **"Allow"**
3. Refresh the page
4. Try again

## Step 4: Verify VAPID Keys (Backend)

The push notification system requires 3 secrets to be configured:

1. **Check if keys are configured:**
   - Open browser console
   - Look for: "VAPID keys not configured" warning
   
2. **If keys are missing:**
   - See `EMMA_PUSH_NOTIFICATION_SECRETS.md` for pre-generated keys
   - Or generate fresh keys: `npx web-push generate-vapid-keys`

3. **Add to Settings:**
   - Open Settings in sidebar (⚙️)
   - Add these 3 secrets:
     - `VAPIDPublicKey`
     - `VAPIDPrivateKey`
     - `VAPIDEmail`

## Step 5: Clear Site Data (Last Resort)

**Warning:** This will log you out and clear all local data.

### Chrome/Edge
1. DevTools (F12) → **Application** tab
2. Click **"Storage"** in left sidebar
3. Click **"Clear site data"** button
4. Refresh the page
5. Log back in
6. Enable notifications again

### Firefox
1. DevTools (F12) → **Storage** tab
2. Right-click on your site → **"Delete All"**
3. Refresh the page
4. Log back in
5. Enable notifications again

## Step 6: Test Notification Permission Directly

Open browser console and run:

```javascript
// Check current permission
console.log('Current permission:', Notification.permission);

// Request permission
Notification.requestPermission().then(permission => {
  console.log('New permission:', permission);
  
  if (permission === 'granted') {
    new Notification('Test', { body: 'Notifications are working!' });
  }
});
```

**Expected results:**
- If permission is `'granted'` → Notifications are enabled
- If permission is `'denied'` → Follow browser permission reset steps above
- If permission is `'default'` → Browser will show prompt when requested

## What to Look For

✅ **Working correctly:**
- Console shows: "Current notification permission: granted"
- Service worker shows as "Activated and running"
- Toggle switch stays ON after clicking
- Test notification button appears
- Test notification arrives on device

❌ **Not working - Common issues:**

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| "Notifications Blocked" error persists | Browser permission denied | Reset permissions (Step 3) |
| "Push notifications are not configured" | VAPID keys missing | Add VAPID secrets (Step 4) |
| Toggle turns off immediately | Service worker not running | Check service worker (Step 2) |
| No browser prompt appears | Permission previously denied | Reset permissions (Step 3) |
| Error: "Failed to subscribe" | Multiple possible causes | Check console logs (Step 1) |

## Still Not Working?

If you've tried all steps above:

1. **Copy console logs:**
   - Open DevTools → Console tab
   - Copy all error messages
   - Note which step fails

2. **Check browser version:**
   - Ensure you're using a supported browser:
     - Chrome 50+
     - Firefox 44+
     - Safari 16+ (macOS 13+, iOS 16.4+)
     - Edge 17+

3. **Try different browser:**
   - Test in Chrome if using Firefox (or vice versa)
   - This helps isolate browser-specific issues

4. **Check network/firewall:**
   - Some corporate networks block push notifications
   - Try on different network (mobile hotspot, home wifi)

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] Browser console shows "Current notification permission: granted"
- [ ] Service worker is registered and running (Application tab)
- [ ] VAPID keys are configured (no "not configured" warnings)
- [ ] Not in incognito/private browsing mode
- [ ] Using a supported browser version
- [ ] Page has been refreshed after adding VAPID keys
- [ ] No firewall/network blocking notifications

If all checked ✅ → Push notifications should work!

---

**Once working, you'll see:**
- Toggle stays ON
- "Send Test Notification" button appears
- Test notification displays on your device
- Emma's logo appears in notification
- Clicking notification opens the app
