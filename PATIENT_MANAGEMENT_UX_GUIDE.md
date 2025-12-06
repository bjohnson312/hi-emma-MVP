# Patient Management UX Guide

## Overview
The new patient management system is now integrated into the Provider Portal's "Patients" tab with a clean, collapsible UX that preserves the existing patient access list.

---

## User Interface Layout

### Top Section: Patient Records Management (Collapsible)
```
┌─────────────────────────────────────────────────────────────┐
│ 👥 Patient Records Management          [+ Add Patient] [▼]  │
│    Create, edit, and manage patient records                 │
├─────────────────────────────────────────────────────────────┤
│ [Expanded View - Shows when clicked]                        │
│                                                              │
│ [Search: _______________] [🔍]  [+ Add Patient]             │
│                                                              │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│ │ Jane Doe │  │ John Smith│  │ Mary Lee │                   │
│ │ ✓App User│  │ Record    │  │ ✓App User│                   │
│ │ MRN-123  │  │ Only      │  │ MRN-456  │                   │
│ │ [Edit] [🗑]│  │ [Edit] [🗑]│  │ [Edit] [🗑]│                   │
│ └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Bottom Section: Patient Access List (Always Visible)
```
┌─────────────────────────────────────────────────────────────┐
│ Patient Access List                                         │
│ Patients who have granted you access to their health data   │
├─────────────────────────────────────────────────────────────┤
│ [Existing EnhancedPatientList component]                    │
│ - Shows patients from provider_patient_access table         │
│ - Click to view full patient profile                        │
│ - Displays recent activity, care plans, etc.                │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Collapsible Panel
- **Collapsed (Default)**: Shows header with "Add Patient" button
- **Expanded**: Shows full patient CRUD interface
- **Toggle**: Click anywhere on header (except "Add Patient" button)
- **Quick Add**: Click "Add Patient" button to auto-expand and open modal

### 2. Patient Cards
Each patient card displays:
- **Full Name** (large, bold)
- **Contact Info** (email or phone)
- **Medical Record Number** (MRN-xxxxx)
- **Badge**: 
  - 🟢 "App User" (green) - Patient has linked app account
  - ⚪ "Record Only" (gray) - Patient record without app access
- **Actions**:
  - ✏️ Edit button
  - 🗑️ Delete button (soft delete)

### 3. Search Functionality
- Search by: Name, Email, Phone, MRN
- Real-time filtering
- Press Enter or click 🔍 to search

### 4. Add/Edit Patient Modal
**Form Fields:**
- Full Name * (required)
- Email
- Phone
- Date of Birth
- Medical Record Number
- Address
- Notes (textarea)

**Validation:**
- Full name required
- Email/MRN uniqueness per provider
- Duplicate detection on create/edit

---

## User Workflows

### Workflow 1: Add New Patient
1. Click "Add Patient" button (auto-expands panel)
2. Fill in patient information form
3. Click "Add Patient" to save
4. Patient card appears in grid
5. Toast notification confirms success

### Workflow 2: Edit Existing Patient
1. Expand patient management panel (if collapsed)
2. Find patient card
3. Click "Edit" button
4. Modify information in modal
5. Click "Update Patient" to save
6. Card updates with new information

### Workflow 3: Delete Patient
1. Expand patient management panel
2. Find patient card
3. Click delete (🗑️) button
4. Confirm deletion in browser prompt
5. Patient is deactivated (soft delete)
6. Card disappears from list

### Workflow 4: Search Patients
1. Expand patient management panel
2. Type in search box
3. Press Enter or click 🔍
4. Results filter in real-time
5. Clear search to see all patients

### Workflow 5: Assign Care Plan to Patient
1. Navigate to "Care Plans" tab
2. Create/edit care plan
3. Click "Continue to Assign Patients"
4. Click "Load Patients" button
5. Select patients from list (shows UUID patients)
6. Click "Assign to X Patients"
7. Care plan created with `patient_id`

---

## Visual Indicators

### App Access Badge
- **Green with checkmark**: Patient has linked app account (`user_id` is set)
- **Gray**: Patient is record-only (`user_id` is null)

### Patient List Comparison

**Top Section (Patient Records Management):**
- UUID-based patient records
- Provider-created and owned
- CRUD functionality
- May or may not have app access

**Bottom Section (Patient Access List):**
- Patients from `provider_patient_access` table
- Patients who granted provider access
- View-only (click to see profile)
- Always have app accounts

---

## Responsive Design

### Desktop (≥768px)
- Side-by-side patient cards (3 columns)
- Full sidebar visible
- Expanded forms and modals

### Mobile (<768px)
- Single column patient cards
- Collapsible sidebar
- Bottom navigation bar
- Full-screen modals

---

## State Management

### Collapsible State
- Default: Collapsed
- Clicking "Add Patient" button: Auto-expands
- Clicking header: Toggles expand/collapse
- State persists during session

### Data Loading
- Patients loaded on initial expand
- Search triggered manually (Enter key or button)
- Auto-refresh after CRUD operations

---

## Integration Points

### Care Plans
- Care plan assignment now uses patient UUID from patient management
- Patients show app access badge in assignment list
- Both UUID patients and user_id patients supported

### Provider Portal Navigation
- "Patients" tab shows combined view
- Top: CRUD management (collapsible)
- Bottom: Access list (always visible)
- Seamless transition between views

---

## Future Enhancements

1. **Auto-expand on first visit** (new user onboarding)
2. **Remember collapse state** (localStorage)
3. **Bulk import** (CSV upload)
4. **Export patient list** (CSV/PDF)
5. **Advanced filters** (by app access, last activity, etc.)
6. **Patient detail view** (timeline, full history)
7. **Link existing user** (UI for link-user endpoint)

---

## Technical Notes

- **Component**: `CombinedPatientsView.tsx`
- **Child Components**: 
  - `PatientManagementView.tsx` (CRUD)
  - `EnhancedPatientList.tsx` (access list)
- **API Endpoints**: `backend.patients.*`
- **State**: Local component state (expandable on request)
