# OAuth Authentication Setup Guide

## Overview

Your Hi, Emma application now supports authentication with:
- **Email/Password** (existing implementation - fully functional)
- **Google OAuth** (requires Clerk dashboard configuration)
- **Apple OAuth** (requires Clerk dashboard configuration)  
- **Facebook OAuth** (requires Clerk dashboard configuration)

## Current Status

✅ **Email/Password Login**: Fully functional - users can sign up and log in with email and password
✅ **OAuth UI**: OAuth buttons are displayed on the login page
⚠️ **OAuth Providers**: Require configuration in the Clerk dashboard

## Email/Password Authentication

The existing email/password authentication is **already working**. Users can:
- Sign up with email and password
- Sign in with existing credentials
- All data is stored in your database
- Sessions are managed securely

**No additional setup required for email/password authentication.**

## OAuth Provider Setup

To enable Google, Apple, or Facebook login, you need to configure these providers in your Clerk dashboard:

### 1. Access Clerk Dashboard

1. Go to https://dashboard.clerk.com
2. Select your application: **epic-louse-87**
3. Navigate to **"Configure"** → **"SSO Connections"** or **"Social Connections"**

### 2. Enable Google OAuth

1. In the Clerk dashboard, click **"Add connection"**
2. Select **"Google"**
3. Choose one of two options:

   **Option A: Use Clerk's Google OAuth (Recommended for Testing)**
   - Simply toggle on "Use Clerk's development keys"
   - This works immediately for testing but has limitations
   - Clerk branding will appear in the OAuth flow

   **Option B: Use Your Own Google OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Set the authorized redirect URI to:
     ```
     https://epic-louse-87.clerk.accounts.dev/v1/oauth_callback
     ```
   - Copy the **Client ID** and **Client Secret**
   - Paste them into your Clerk dashboard
   - Click **Save**

4. The Google sign-in button will now work

### 3. Enable Apple OAuth

1. In the Clerk dashboard, click **"Add connection"**
2. Select **"Apple"**
3. You'll need to configure Apple Sign In through the Apple Developer Portal:

   **Steps:**
   - Go to [Apple Developer](https://developer.apple.com)
   - Navigate to **Certificates, Identifiers & Profiles**
   - Create a new **App ID** or select an existing one
   - Enable **Sign In with Apple** capability
   - Create a **Service ID** for web authentication
   - Configure the redirect URI:
     ```
     https://epic-louse-87.clerk.accounts.dev/v1/oauth_callback
     ```
   - Create a **Private Key** for Sign In with Apple
   - Copy the **Service ID**, **Team ID**, **Key ID**, and **Private Key**
   - Enter these into your Clerk dashboard
   - Click **Save**

4. The Apple sign-in button will now work

### 4. Enable Facebook OAuth

1. In the Clerk dashboard, click **"Add connection"**
2. Select **"Facebook"**
3. Choose one of two options:

   **Option A: Use Clerk's Facebook OAuth (Recommended for Testing)**
   - Simply toggle on "Use Clerk's development keys"
   - This works immediately for testing but has limitations

   **Option B: Use Your Own Facebook OAuth Credentials**
   - Go to [Facebook Developers](https://developers.facebook.com)
   - Create a new app or select an existing one
   - Add **Facebook Login** product
   - Go to **Settings** → **Basic**
   - Copy the **App ID** and **App Secret**
   - Go to **Facebook Login** → **Settings**
   - Add the OAuth redirect URI:
     ```
     https://epic-louse-87.clerk.accounts.dev/v1/oauth_callback
     ```
   - Paste the credentials into your Clerk dashboard
   - Click **Save**

4. The Facebook sign-in button will now work

## Redirect URLs

Your application is configured with the following redirect URLs:

- **OAuth Callback**: `https://epic-louse-87.clerk.accounts.dev/v1/oauth_callback`
- **After Sign-In**: `/` (application home)
- **After Sign-Up**: `/` (application home)

These are automatically handled by Clerk and don't require additional configuration in your code.

## Testing OAuth

Once you've configured the providers in Clerk:

1. Go to your application login page
2. Click on the Google, Apple, or Facebook button
3. You'll be redirected to the provider's login page
4. After successful authentication, you'll be redirected back to your application
5. You'll be automatically logged in

## Important Notes

### For Production

- **Google**: You must use your own OAuth credentials (not Clerk's development keys)
- **Apple**: Required to submit your app to the App Store if using iOS
- **Facebook**: You must use your own OAuth credentials for production
- All providers require domain verification for production use

### Privacy & Terms

Make sure to:
- Add links to your Privacy Policy
- Add links to your Terms of Service
- These are required by Google, Apple, and Facebook for OAuth approval

### Clerk Secret Key

The Clerk Secret Key has already been configured as a secret named `ClerkSecretKey` in your backend. This is used to verify OAuth tokens from Clerk.

## Troubleshooting

### "OAuth failed" error
- Check that the provider is enabled in Clerk dashboard
- Verify redirect URLs match exactly
- Ensure OAuth credentials are correct

### Redirects don't work
- The redirect URLs are managed by Clerk
- They should work automatically once providers are configured
- If issues persist, check the Clerk dashboard logs

### Email/Password still works but OAuth doesn't
- This is expected until you configure the OAuth providers in Clerk
- Email/password authentication is completely independent and will continue working

## Summary

**What's Working Now:**
- ✅ Email and password sign-up and login
- ✅ User session management
- ✅ OAuth UI is ready and displayed

**What Needs Configuration:**
- ⚠️ Google OAuth - Configure in Clerk dashboard
- ⚠️ Apple OAuth - Configure in Clerk dashboard
- ⚠️ Facebook OAuth - Configure in Clerk dashboard

**Email/password authentication works immediately with no additional setup required.**
