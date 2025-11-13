# VAPID Keys Setup for Web Push Notifications

## Step 1: Generate VAPID Keys

Run this command to generate your VAPID keys:

```bash
npx web-push generate-vapid-keys
```

This will output something like:

```
=======================================

Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBrYTjA==

Private Key:
bdSiGDlfv-loQZXZpIivyaHJIIjBnDcqQdShPmjPcHI

=======================================
```

## Step 2: Add to Encore Secrets

1. Open the **Settings** in the sidebar of your Leap/Encore application
2. Add the following secrets:

**Secret 1:**
- Name: `VAPIDPublicKey`
- Value: [Your Public Key from Step 1]

**Secret 2:**
- Name: `VAPIDPrivateKey`
- Value: [Your Private Key from Step 1]

**Secret 3:**
- Name: `VAPIDEmail`
- Value: `mailto:your-email@example.com` (use your actual email)

## Step 3: Verify Secrets

The backend will automatically use these secrets when sending push notifications.

## Security Notes

- ✅ Keep the Private Key secret - never commit it to version control
- ✅ The Public Key is safe to expose to the frontend
- ✅ These keys uniquely identify your application to push services
- ✅ If compromised, regenerate keys and update all subscriptions

## What These Keys Do

- **VAPID** = Voluntary Application Server Identification
- Proves to browser push services (Google/Apple/Mozilla) that you own this notification server
- Required by the Web Push Protocol standard
- Each app should have unique VAPID keys
