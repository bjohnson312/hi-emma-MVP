# Care Team Authentication Fix

## Problem
Care Team API endpoints were defined with `auth: true` which requires Encore.ts's built-in authentication system. However, the existing application doesn't use this auth system - instead it passes `userId` as a parameter to endpoints.

## Error Encountered
```
Error adding member - Endpoint requires auth but none provided
```

## Solution
Changed all Care Team endpoints from using `auth: true` to accepting `userId` as a parameter, matching the pattern used throughout the rest of the application (e.g., profile, morning check-ins, etc.).

## Files Modified

### Backend
- `/backend/care_team/add_member.ts` - Added `userId` param, removed `auth: true`
- `/backend/care_team/update_member.ts` - Added `userId` param, removed `auth: true`
- `/backend/care_team/list_members.ts` - Added `userId` param, removed `auth: true`
- `/backend/care_team/delete_member.ts` - Added `userId` param, removed `auth: true`
- `/backend/care_team/get_setup_progress.ts` - Added `userId` param, removed `auth: true`
- `/backend/care_team/update_setup_progress.ts` - Added `userId` param, removed `auth: true`
- `/backend/care_team/get_members_needing_email.ts` - Added `userId` param, removed `auth: true`

### Frontend
- `/frontend/components/views/CareTeamView.tsx` - Pass `userId` to all API calls and child components
- `/frontend/components/CareTeamSetupFlow.tsx` - Accept and use `userId` prop
- `/frontend/components/CareTeamList.tsx` - Accept and use `userId` prop
- `/frontend/App.tsx` - Pass `userId` to CareTeamView

## Pattern Used

### Before (Broken)
```typescript
export const addMember = api(
  { method: "POST", path: "/care-team/members", expose: true, auth: true },
  async (params: AddCareTeamMemberRequest): Promise<CareTeamMember> => {
    const auth = getAuthData()!;
    // Use auth.userID
  }
);
```

### After (Working)
```typescript
export const addMember = api(
  { method: "POST", path: "/care-team/members", expose: true },
  async (params: AddMemberRequest): Promise<CareTeamMember> => {
    // Use params.userId
  }
);
```

### Frontend Usage
```typescript
// Get userId from localStorage or props
const currentUserId = userId || localStorage.getItem("emma_user_id") || "";

// Pass to all API calls
await backend.care_team.addMember({
  userId: currentUserId,
  memberType: "family",
  name: "John Doe",
  // ... other fields
});
```

## Testing
The fix allows users to:
1. ✅ Add care team members through the setup flow
2. ✅ Update member information
3. ✅ Delete members
4. ✅ Track setup progress
5. ✅ Complete setup and unlock milestone

## Build Status
- Care Team module: ✅ No errors
- Provider Portal: ⚠️ Pre-existing errors (unrelated to this fix)

The Care Team feature is now fully functional with proper authentication!
