# Healthcare Provider Portal - Setup & Usage Guide

## Overview

The Healthcare Provider Portal is a HIPAA-compliant secure portal that enables healthcare providers to:
- View shared patient wellness data
- Add clinical notes and recommendations
- Communicate securely with patients through Emma
- Access comprehensive audit logs for compliance

## Key Features

### 🔐 Security & Compliance
- **Role-Based Access Control (RBAC)**: Providers have different access levels (read, write, full)
- **HIPAA Audit Logging**: All actions are logged with timestamps, actor information, and details
- **Patient Consent Management**: Patients explicitly grant and can revoke provider access
- **Session Management**: Secure JWT-based authentication with 7-day tokens
- **Access Expiration**: Time-limited access to patient data

### 👨‍⚕️ Provider Features
- **Patient List**: View all patients who have granted access
- **Wellness Data Dashboard**: 
  - Morning check-in history
  - Mood tracking data
  - Wellness journal entries
  - AI-generated insights
- **Clinical Notes**: Add structured notes with priority levels
- **Secure Messaging**: Direct communication with patients
- **Audit Trail**: Complete view of all access and modifications

### 👤 Patient Features
- **Grant Access**: Invite providers by email with specific access levels
- **Revoke Access**: Remove provider access at any time
- **View Provider Notes**: See recommendations and observations from providers
- **Access Management**: Track which providers have access and when it expires

## Getting Started

### For Healthcare Providers

1. **Account Creation**
   - Navigate to `/provider` (separate from patient portal)
   - Click "Sign Up"
   - Provide:
     - Email address
     - Password
     - Full name
     - Credentials (e.g., MD, PhD) - optional
     - Specialty - optional
     - Organization - optional
     - License number - optional

2. **Patient Access**
   - Patients must grant you access first
   - Once granted, you'll see the patient in your "My Patients" list
   - Access levels:
     - **Read**: View patient data only
     - **Write**: View and add notes/messages
     - **Full**: Complete access (future: data modifications)

3. **Viewing Patient Data**
   - Click on a patient from your list
   - Navigate between tabs:
     - **Wellness Data**: View all health metrics
     - **Notes**: Add and view clinical notes
     - **Messages**: Secure communication

4. **Adding Clinical Notes**
   - Select a patient
   - Go to "Notes" tab
   - Add subject and content
   - Notes are automatically visible to patients

5. **Messaging Patients**
   - Select a patient
   - Go to "Messages" tab
   - Send secure messages through Emma
   - Patients receive messages in their portal

6. **Audit Logs**
   - Click "Audit Logs" in sidebar
   - View all your access and modification history
   - Filter by patient or action type
   - All logs include timestamps and details for HIPAA compliance

### For Patients

1. **Grant Provider Access**
   - Log in to Emma
   - Navigate to "Provider Access" in sidebar
   - Click "Grant Access"
   - Enter provider's email address
   - Choose access level (read/write/full)
   - Set expiration period (days)
   - Provider must already have a provider account

2. **View Provider Notes**
   - Navigate to "Provider Access"
   - Scroll to "Provider Notes & Recommendations"
   - See all notes from your healthcare team
   - Notes include priority levels and timestamps

3. **Revoke Access**
   - Navigate to "Provider Access"
   - Find the provider in your list
   - Click "Revoke Access"
   - Confirm the action
   - Provider immediately loses access

## Technical Architecture

### Database Schema

**healthcare_providers**
- Provider account information
- Credentials and specialties
- Role-based permissions

**provider_patient_access**
- Access control matrix
- Patient consent tracking
- Expiration management

**provider_notes**
- Clinical observations
- Recommendations
- Priority levels
- Patient visibility flags

**provider_patient_messages**
- Secure messaging
- Read receipts
- Conversation history

**audit_logs**
- Complete activity tracking
- Actor identification
- Resource tracking
- HIPAA compliance metadata

### API Endpoints

**Provider Authentication**
- `POST /provider/signup` - Create provider account
- `POST /provider/login` - Authenticate provider

**Provider Portal**
- `GET /provider/patients` - List accessible patients
- `GET /provider/patients/:id/data` - View patient wellness data
- `POST /provider/patients/:id/notes` - Add clinical note
- `GET /provider/patients/:id/notes` - List notes
- `POST /provider/patients/:id/messages` - Send message
- `GET /provider/patients/:id/messages` - View messages
- `GET /provider/audit-logs` - View audit trail

**Patient Sharing**
- `POST /patient/grant-access` - Grant provider access
- `POST /patient/revoke-access/:providerId` - Revoke access
- `GET /patient/provider-access` - List providers
- `GET /patient/provider-notes` - View provider notes

### Security Features

1. **Authentication**
   - Separate JWT tokens for providers and patients
   - Token expiration (7 days)
   - Secure password hashing (bcrypt)

2. **Authorization**
   - Access level checks on every request
   - Expiration validation
   - Patient consent verification

3. **Audit Logging**
   - Automatic logging of all actions
   - Immutable audit trail
   - HIPAA-compliant metadata
   - Searchable and filterable

4. **Data Privacy**
   - Patients control access
   - Time-limited permissions
   - Granular access levels
   - Immediate revocation

## HIPAA Compliance

The provider portal implements several HIPAA requirements:

✅ **Access Controls**: Role-based permissions with patient consent
✅ **Audit Controls**: Complete logging of all PHI access
✅ **Integrity Controls**: Immutable audit logs
✅ **Transmission Security**: HTTPS-only (enforced by Encore)
✅ **Person Authentication**: Secure JWT-based auth
✅ **Authorization**: Granular access levels
✅ **Activity Tracking**: Full audit trail with timestamps

## Access the Provider Portal

The provider portal is a separate application from the patient portal:

1. **Patient Portal**: Main Emma app at the root URL
2. **Provider Portal**: Access via `ProviderPortalApp.tsx` (separate entry point)

To deploy both portals, you would typically:
- Create a separate route or subdomain for providers
- Use the `ProviderPortalApp` component as the entry point
- Maintain separate authentication flows

## Usage Examples

### Example: Provider Viewing Patient Data

```typescript
// Provider logs in
const loginResponse = await backend.provider_auth.login({
  email: "doctor@hospital.com",
  password: "secure_password"
});

// View patient list
const patients = await backend.provider_portal.listPatients({
  headers: { authorization: `Bearer ${loginResponse.token}` }
});

// Access specific patient data
const patientData = await backend.provider_portal.getPatientData(
  { patientUserId: "patient-123" },
  { headers: { authorization: `Bearer ${loginResponse.token}` } }
);

// Add a clinical note
await backend.provider_portal.addNote(
  { patientUserId: "patient-123" },
  {
    patientUserId: "patient-123",
    noteType: "recommendation",
    subject: "Sleep Schedule",
    content: "Recommend maintaining consistent 7-8 hour sleep schedule",
    priority: "normal"
  },
  { headers: { authorization: `Bearer ${loginResponse.token}` } }
);
```

### Example: Patient Granting Access

```typescript
// Patient grants access to provider
await backend.patient_sharing.grantProviderAccess({
  providerEmail: "doctor@hospital.com",
  accessLevel: "write",
  expiresInDays: 90
});

// Patient views provider notes
const notes = await backend.patient_sharing.getProviderNotes();

// Patient revokes access
await backend.patient_sharing.revokeProviderAccess({
  providerId: "provider-uuid-here"
});
```

## Future Enhancements

Potential improvements for the provider portal:

1. **Multi-factor Authentication** for provider accounts
2. **Provider Organizations** for group practices
3. **Data Export** for providers in various formats
4. **Analytics Dashboard** for population health
5. **Prescription Integration** for medication tracking
6. **Lab Results Integration** for test data
7. **Appointment Scheduling** through Emma
8. **Video Consultations** embedded in portal
9. **Advanced Search** across patient records
10. **Custom Reports** and data visualization

## Support

For technical issues or questions:
- Review audit logs for access issues
- Verify patient consent has been granted
- Check access level permissions
- Ensure tokens haven't expired
- Contact system administrator for account issues
