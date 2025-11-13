# Service Worker Registration - Code Backup

**Date:** 2025-11-13  
**File:** `/frontend/App.tsx` (lines 32-59)  
**Reason:** Backup before fixing service worker registration bug

## Current Code (WITH BUG):

```typescript
function registerServiceWorker() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return;
  }
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const swUrl = `${window.location.origin}/sw.js`;
        const response = await fetch(swUrl, { method: 'HEAD' });
        
        if (!response.ok) {
          console.warn('⚠️ Service Worker file not found, skipping registration');
          return;
        }
        
        const registration = await navigator.serviceWorker.register('/sw.js', { 
          scope: '/',
          type: 'classic'
        });
        
        console.log('✅ Service Worker registered successfully:', registration.scope);
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error instanceof Error ? error.message : 'Unknown error');
      }
    });
  }
}
```

## The Bug:

- Line 40: `const swUrl = ${window.location.origin}/sw.js;`
- This causes a HEAD request to the **wrong origin** (API domain instead of frontend domain)
- Console error: "Service worker registration for scope ... could not be completed"
- Result: Service worker never registers, push notifications completely broken

## To Revert:

Replace the `registerServiceWorker()` function in `/frontend/App.tsx` with the code above.

## Original Code (BEFORE MY FIRST FIX):

```typescript
function registerServiceWorker() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return;
  }
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { 
        scope: '/',
        type: 'classic'
      })
        .then(registration => {
          console.log('✅ Service Worker registered successfully:', registration.scope);
        })
        .catch(error => {
          console.warn('⚠️ Service Worker registration failed:', error.message);
        });
    });
  }
}
```

This original version was simpler but showed console errors if sw.js didn't exist.
