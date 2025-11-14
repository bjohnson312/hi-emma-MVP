# iOS Safari Speech Recognition Fix

## Date: 2025-11-14

## Problem
iOS Safari was throwing "service-not-allowed" error even when microphone permission was granted. This happened because the Speech Recognition API on iOS Safari requires `recognition.start()` to be called **synchronously** within a user gesture (click handler).

## Root Cause
In `MicrophoneSetup.tsx`, the `handleStartTest` function was using:
```typescript
setTimeout(() => {
  startListening();
}, isTTSSupported ? 3000 : 500);
```

This `setTimeout` broke the "user gesture" chain on iOS Safari, causing the Speech Recognition API to reject the request with "service-not-allowed" even though microphone permission was granted.

## Solution Implemented

### 1. MicrophoneSetup.tsx Changes

#### Change 1: Added Upfront Instruction
Added a prominent instruction box on the intro screen that tells users what to say BEFORE they click the button:
```tsx
<div className="bg-gradient-to-br from-[#6656cb]/20 to-[#364d89]/20 rounded-2xl p-5 border-2 border-[#6656cb]/40">
  <p className="font-bold text-[#323e48] text-lg">Ready to Test?</p>
  <p className="text-[#323e48] font-medium">
    When you click "Test Microphone", please say:
  </p>
  <p className="text-2xl font-bold text-[#6656cb] mt-2">
    "Hello Emma"
  </p>
</div>
```

#### Change 2: Simplified handleStartTest Function
Removed all async operations and delays. Now calls `startListening()` immediately:
```typescript
const handleStartTest = useCallback(() => {
  setStep('testing');
  setTestTranscript('');
  resetTranscript();
  startListening(); // Called synchronously - fixes iOS Safari!
}, [startListening, resetTranscript]);
```

**Key changes:**
- ❌ Removed `async` keyword
- ❌ Removed `await navigator.mediaDevices.getUserMedia()` (unnecessary - speech recognition handles permission)
- ❌ Removed TTS instruction during test
- ❌ Removed `setTimeout`
- ✅ Calls `startListening()` immediately and synchronously

#### Change 3: Improved Error Messaging
Changed error styling from red (alarming) to amber (informational) and added a "Continue with Typing" button:
```tsx
{speechError && (
  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
    <p className="text-sm font-medium text-amber-900 mb-1">Voice Input Unavailable</p>
    <p className="text-sm text-amber-800 mb-3">{speechError}</p>
    <Button
      onClick={handleComplete}
      variant="outline"
      className="w-full border-amber-300 hover:bg-amber-100 text-amber-900"
    >
      Continue with Typing Instead
    </Button>
  </div>
)}
```

#### Change 4: Better "Not Supported" Screen
Changed from red error style to blue informational style with iOS-specific messaging:
```tsx
if (!isSpeechSupported) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return (
    <div className="...">
      <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 ...">
        <Mic className="w-8 h-8 text-blue-500" />
      </div>
      <h2>Voice Input Not Available</h2>
      <p>
        {isIOS 
          ? "Voice input isn't available in Safari on iOS. You can still chat with Emma by typing your messages."
          : "Your browser doesn't support voice input. Please use Chrome, Edge, or desktop Safari for voice features."}
      </p>
      <Button>Continue with Typing</Button>
    </div>
  );
}
```

## New User Flow

1. **Intro Screen:**
   - Shows 3-step process
   - **NEW:** Prominent instruction box: "When you click 'Test Microphone', please say: **Hello Emma**"
   - User clicks "Test Microphone"

2. **Testing Screen:**
   - Immediately starts listening (no TTS, no delay) ✅ **Fixes iOS Safari**
   - Shows visual "Listening..." indicator
   - Shows "Say: 'Hello Emma'" on screen
   - Captures user's voice
   - User clicks "Finish Test"

3. **Success Screen:**
   - Shows success message
   - Plays TTS: "Great! Your microphone is working perfectly. You're all set to chat with me."
   - Shows tips for using voice features

## Why This Works

iOS Safari's Speech Recognition API has a security requirement that `recognition.start()` must be called **synchronously** within the event handler triggered by a user gesture (like a button click). Any asynchronous operations (async/await, setTimeout, promises) break this chain and cause the API to reject the request.

By calling `startListening()` immediately and synchronously in the click handler, we maintain the user gesture chain and satisfy iOS Safari's security requirement.

## Backup

Original code backed up in: `/MICROPHONE_SETUP_BACKUP.md`

To revert, simply copy the code from that file back into `/frontend/components/MicrophoneSetup.tsx`

## Testing Checklist

- [ ] Test on iOS Safari - microphone should work without "service-not-allowed" error
- [ ] Test on Chrome desktop - should work as before
- [ ] Test on Android Chrome - should work as before  
- [ ] Test "Continue with Typing" button when error occurs
- [ ] Verify success TTS still plays after successful test
- [ ] Verify visual instruction is clear on intro screen
