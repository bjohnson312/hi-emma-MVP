# Mobile Voice Nudge - Testing Guide

**Feature:** Mobile phone voice nudge + skip MicrophoneSetup  
**Implementation Date:** 2025-11-27

---

## Quick Test Instructions

### Test 1: Desktop Browser (Chrome/Edge/Safari on Mac/Windows)

**Expected Flow:** Onboarding → MicrophoneSetup → Main App

**Steps:**
1. Open app in desktop browser
2. Sign up with new account
3. Complete onboarding steps 0-4 (name, reason, feeling, time, reminders)
4. ✅ **Should see:** MicrophoneSetup screen with "Test Microphone" button
5. Complete mic setup or click "Skip for Now"
6. ✅ **Should see:** Main app loads

**localStorage Check:**
- Open DevTools Console
- Run: `localStorage.getItem('emma_mic_setup_complete')`
- ✅ **Should return:** `'true'` (if completed) or `null` (if skipped via button)

---

### Test 2: iPhone (Safari)

**Expected Flow:** Onboarding → Mobile Voice Nudge → Main App (no MicSetup)

**Steps:**
1. Open app in iPhone Safari browser
2. Sign up with new account
3. Complete onboarding steps 0-4
4. ✅ **Should see:** "Talking to Emma on Your Phone" screen with:
   - Microphone icon
   - Instructions about keyboard mic 🎤
   - Examples: "Hi, Emma" or "Hi, Emma, help me with..."
   - Microcopy about built-in dictation
   - "Got it, let's start!" button
5. Click "Got it, let's start!"
6. ✅ **Should see:** Main app loads immediately (NO MicrophoneSetup screen)

**Console Check:**
- Open Safari DevTools (desktop) or use Web Inspector
- ✅ **Should see log:** `[Onboarding] Skipped mic setup for mobile phone`

**localStorage Check:**
- Console: `localStorage.getItem('emma_mic_setup_complete')`
- ✅ **Should return:** `'skipped_mobile'`

**Voice Test (Optional):**
7. In main app, try using keyboard microphone in a text field
8. Tap 🎤 on iPhone keyboard
9. Say "Hi Emma"
10. ✅ **Should work:** Text appears in field

---

### Test 3: Android Phone (Chrome)

**Expected Flow:** Same as iPhone

**Steps:**
1. Open app in Android Chrome browser
2. Sign up with new account
3. Complete onboarding steps 0-4
4. ✅ **Should see:** Mobile voice nudge screen (same as iPhone)
5. Click "Got it, let's start!"
6. ✅ **Should see:** Main app (no MicSetup)

**Console/localStorage:** Same as iPhone test

---

### Test 4: iPad (Safari)

**Expected Flow:** Onboarding → MicrophoneSetup → Main App (treated as tablet, NOT phone)

**Steps:**
1. Open app in iPad Safari
2. Sign up with new account
3. Complete onboarding steps 0-4
4. ✅ **Should see:** MicrophoneSetup screen (same as desktop)
5. ✅ **Should NOT see:** Mobile voice nudge

**Why:** iPad has userAgent = "ipad" (not "iphone"), so `isMobilePhoneDevice()` returns `false`

---

### Test 5: Android Tablet

**Expected Flow:** Same as iPad (treated as tablet)

**Steps:**
1. Open app in Android tablet Chrome
2. Complete onboarding
3. ✅ **Should see:** MicrophoneSetup screen
4. ✅ **Should NOT see:** Mobile voice nudge

**Why:** Android tablets don't have "mobile" in userAgent, so `isMobilePhoneDevice()` returns `false`

---

### Test 6: Existing User (Already Completed Onboarding)

**Expected Flow:** Login → Main App (no onboarding, no MicSetup)

**Steps:**
1. Log in with existing account that already completed onboarding
2. ✅ **Should see:** Main app immediately
3. ✅ **Should NOT see:** Onboarding flow
4. ✅ **Should NOT see:** MicrophoneSetup

**Why:** `checkOnboardingStatus()` returns `onboarding_completed = true`, so onboarding is skipped

---

## Edge Case Tests

### Edge Case 1: iPhone "Request Desktop Website" Mode

**Steps:**
1. iPhone Safari: Tap "aA" in address bar
2. Enable "Request Desktop Website"
3. Sign up with new account
4. Complete onboarding
5. ✅ **Expected:** Still shows mobile voice nudge (userAgent still contains "iphone")
6. ✅ **Acceptable:** Even in desktop mode, iOS Safari has limited mic APIs

---

### Edge Case 2: PWA on iPhone

**Steps:**
1. Add Emma to iPhone home screen (PWA)
2. Open from home screen icon
3. Sign up with new account
4. Complete onboarding
5. ✅ **Expected:** Shows mobile voice nudge (same as browser)

---

### Edge Case 3: Refresh During Mobile Nudge

**Steps:**
1. On mobile phone, complete onboarding steps 0-4
2. Reach step 5 (mobile voice nudge screen)
3. Refresh page (pull down to refresh or reload)
4. ✅ **Expected:** Onboarding completes, goes to main app (skips nudge)
5. ✅ **Acceptable:** Rare edge case, nudge is purely educational

---

### Edge Case 4: Device Switch (Phone → Desktop)

**Scenario:** User onboards on phone, later logs in on desktop

**Steps:**
1. Sign up on iPhone, complete onboarding (see mobile nudge)
2. localStorage: `emma_mic_setup_complete = 'skipped_mobile'`
3. Later: Log in same account on desktop computer
4. ✅ **Expected:** Main app loads (no MicSetup shown)
5. ✅ **Voice still works:** Browser prompts for mic permission on first voice use

**Future Enhancement:**
- Settings page could offer "Complete Voice Setup" button
- Check: `if (!isMobilePhoneDevice() && localStorage === 'skipped_mobile')`

---

## DevTools Console Checks

### Desktop/Tablet
```javascript
// Check device detection
isMobilePhoneDevice()  // Should be undefined (not exported globally)

// Check localStorage
localStorage.getItem('emma_mic_setup_complete')
// Should be 'true' after MicSetup completion

// No mobile skip log
// Console should NOT show: "[Onboarding] Skipped mic setup for mobile phone"
```

### Mobile Phone
```javascript
// Check localStorage
localStorage.getItem('emma_mic_setup_complete')
// Should be 'skipped_mobile'

// Check console log
// Console SHOULD show: "[Onboarding] Skipped mic setup for mobile phone"
```

---

## Visual Verification Checklist

### Mobile Voice Nudge Screen (Step 5 on Phones)

**Header:**
- [ ] Large microphone icon (green gradient circle)
- [ ] "Talking to Emma on Your Phone" heading

**Content:**
- [ ] Instructions mention "keyboard icon 🎤"
- [ ] Examples shown:
  - [ ] "Hi, Emma"
  - [ ] "Hi, Emma, help me with my morning routine."
- [ ] Microcopy: "This uses your phone's built-in dictation..."

**Button:**
- [ ] "Got it, let's start!" button visible
- [ ] Button disabled during loading (shows "Starting..." with spinner)

**Emma TTS (Optional):**
- [ ] Emma speaks: "Great! On your phone, you can use the keyboard microphone..."
- [ ] User can mute/unmute via speaker icon in header

---

## Testing Devices Recommendation

**Minimum Required:**
- [ ] 1 desktop browser (Chrome or Safari)
- [ ] 1 iPhone (any iOS version with Safari)
- [ ] 1 Android phone (Chrome)

**Nice to Have:**
- [ ] iPad (to verify tablet behavior)
- [ ] Android tablet
- [ ] Multiple iPhone sizes (Mini, Plus, Max)
- [ ] Different Android brands (Samsung, Pixel, OnePlus)

---

## Known Issues / Expected Behavior

### ✅ Not Issues:

1. **iPhone "Desktop Website" shows mobile nudge**
   - Expected behavior (iOS Safari still has mic limitations)

2. **Refresh on step 5 skips nudge**
   - Expected (rare edge case, purely educational)

3. **Desktop user who onboarded on phone sees no MicSetup**
   - Expected (voice features still work, future Settings enhancement)

4. **Mobile nudge step is frontend-only (not in backend)**
   - Expected (backend only tracks steps 0-4, step 5 is UI-only)

---

## Rollback Plan (If Needed)

If issues are found and rollback is needed:

1. **Revert device-detection.ts:**
   - Remove `isMobilePhoneDevice()` function

2. **Revert App.tsx:**
   - Remove `isMobilePhoneDevice` import
   - Remove `isMobilePhone` prop to OnboardingFlow
   - Restore: `setShowMicSetup(true)` (always true)

3. **Revert OnboardingFlow.tsx:**
   - Remove `isMobilePhone` from props
   - Remove mobile_voice_nudge type
   - Remove step 5 from questions array
   - Remove mobile voice nudge handling in `handleAnswer()`
   - Remove mobile voice nudge UI rendering

4. **Clear localStorage on affected devices:**
   ```javascript
   localStorage.removeItem('emma_mic_setup_complete')
   ```

---

## Success Criteria

### ✅ Feature is successful if:

1. Desktop users still see MicrophoneSetup (no regression)
2. Mobile phone users see mobile voice nudge instead of MicSetup
3. Tablet users (iPad, Android tablet) see MicrophoneSetup
4. Existing users go straight to main app (no onboarding/mic setup)
5. No new browser mic permission prompts on mobile during onboarding
6. Voice features still work on mobile (keyboard mic)
7. Voice features still work on desktop (browser mic)
8. Build succeeds with no errors
9. No console errors during onboarding flow

---

## Questions to Verify During Testing

1. **Does the mobile voice nudge text make sense to users?**
   - Is it clear how to use keyboard mic?
   - Are the examples helpful?

2. **Does Emma's TTS message on step 5 sound natural?**
   - "Great! On your phone, you can use the keyboard microphone..."

3. **Is the "Got it, let's start!" button clear?**
   - Or should it say "Continue to Emma"?

4. **Do users understand they're using keyboard dictation, not browser mic?**
   - Microcopy mentions "built-in dictation"

5. **Any confusion about why tablets see MicSetup but phones don't?**
   - Expected: iPads have better API support

---

## Reporting Issues

If you find issues during testing, please report:

1. **Device/Browser:** e.g., "iPhone 14 Pro, iOS 17.2, Safari"
2. **Flow:** e.g., "Onboarding step 5"
3. **Expected:** e.g., "Should see mobile voice nudge"
4. **Actual:** e.g., "Saw MicrophoneSetup instead"
5. **localStorage value:** e.g., `emma_mic_setup_complete = 'true'` (unexpected)
6. **Console logs:** Copy any errors or relevant logs
7. **Screenshots:** If possible

---

## Status: ✅ READY FOR TESTING

Implementation complete, build successful, ready for real-device testing.
