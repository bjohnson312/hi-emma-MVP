# 🌟 Hi, Emma - Personal Health & Wellness Assistant

> An AI-powered health companion that helps users manage their daily wellness routines, nutrition, medications, and health journey with personalized insights and support.

[![Built with Encore.ts](https://img.shields.io/badge/Built%20with-Encore.ts-5f3dc4)](https://encore.dev)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8)](https://tailwindcss.com)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Features Deep Dive](#features-deep-dive)
- [Admin & Provider Portals](#admin--provider-portals)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Hi, Emma** is a comprehensive health and wellness platform that combines AI-powered conversation, personalized health tracking, and professional care coordination into a single, user-friendly application. The platform supports patients, healthcare providers, and administrators with distinct portals tailored to each user type.

### What Makes Emma Special?

- **🤖 AI-Powered Conversations** - Natural language interactions with health context awareness
- **📊 Comprehensive Health Tracking** - Morning routines, mood, nutrition, medications, and more
- **👨‍⚕️ Provider Integration** - Seamless communication between patients and healthcare teams
- **📱 Multi-Channel Notifications** - Browser push, SMS, and email reminders
- **🎙️ Voice Interactions** - Text-to-speech with customizable voices (including Trinity from The Matrix!)
- **📖 Wellness Journal** - Automated daily summaries with AI-generated insights
- **🥗 Nutrition Planning** - AI-generated meal plans and shopping lists
- **👥 Care Team Management** - Coordinate with family and healthcare providers
- **📈 Progress Tracking** - Visual milestones and achievement system

---

## ✨ Key Features

### For Patients

#### 🌅 Morning Routine Tracking
- Customizable daily check-ins
- Activity logging (exercise, meditation, hydration)
- Mood tracking with context
- Routine completion statistics
- Journal entries with reflections

#### 🍽️ Nutrition & Meal Planning
- **AI-Generated Meal Plans** - Personalized weekly meal plans based on dietary preferences
- **Diet Preferences** - Support for vegetarian, vegan, gluten-free, keto, and more
- **Shopping Lists** - Auto-generated grocery lists from meal plans
- **Calorie & Macro Tracking** - Monitor nutritional intake
- **Food Image Upload** - Visual food logging
- **Nutrition Chat with Emma** - Ask questions about diet and nutrition

#### 💊 Medication Management
- Doctor's orders tracking
- Medication reminders
- Dose tracking and history
- Automated reminder notifications

#### 🌙 Evening Routine
- End-of-day reflection
- Daily summary generation
- Sleep preparation tracking

#### 💬 Conversational AI
- Natural language chat with Emma
- Context-aware responses
- Memory of past conversations
- Voice output with multiple voice options
- Speech-to-text input

#### 📖 Wellness Journal
- **Automatic Daily Summaries** - AI-generated from your activities
- **Chapter-Based Organization** - Group entries by themes or time periods
- **Trend Analysis** - Identify patterns in mood, activities, and health
- **AI Insights** - Chapter-level insights and recommendations
- **Manual Entries** - Add custom journal entries anytime

#### 🔔 Smart Notifications
- **Push Notifications** - Browser-based alerts (uses service workers)
- **SMS Notifications** - Text message reminders (via Twilio)
- **Email Notifications** - Email summaries and alerts
- **Customizable Schedule** - Set your preferred notification times
- **Multiple Reminder Types** - Morning check-ins, medications, evening reflections

#### 📤 Health Data Sharing
- **Export to PDF** - Generate professional health reports
- **Shareable Links** - Create secure, time-limited access links
- **Provider Access** - Grant healthcare providers view-only access
- **Care Team Sharing** - Share updates with family members

#### 🏆 Progress & Milestones
- Achievement tracking
- Visual progress indicators
- Milestone celebrations
- Historical data visualization

### For Healthcare Providers

#### 👨‍⚕️ Provider Portal
- **Patient Dashboard** - View all patients in one place
- **Health Data Access** - Real-time patient health metrics
- **Clinical Notes** - Add private notes to patient records
- **Secure Messaging** - HIPAA-compliant communication
- **Audit Logs** - Complete access history for compliance
- **Access Control** - Granular permissions management

### For Administrators

#### ⚙️ Admin Portal
- **User Management** - View, deactivate, and manage all users
- **System Analytics** - Usage statistics and system health
- **Access Logs** - Complete audit trail of all system access
- **User Export** - Bulk export user data
- **Password Reset** - Administrative password management

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 6.2
- **Styling:** Tailwind CSS v4 with custom design system
- **UI Components:** shadcn/ui + Radix UI primitives
- **Icons:** Lucide React
- **State Management:** React Hooks
- **Package Manager:** Bun

### Backend
- **Framework:** Encore.ts (TypeScript microservices framework)
- **Language:** TypeScript 5.8
- **Database:** PostgreSQL (via Encore.ts built-in)
- **Authentication:** Clerk + JWT + bcrypt
- **Real-time:** WebSockets (Encore.ts streaming APIs)
- **Package Manager:** Bun

### Infrastructure & Services
- **Hosting:** Leap.new (Encore.ts cloud platform)
- **CDN:** Cloudflare
- **SMS:** Twilio integration
- **Push Notifications:** Web Push API + VAPID
- **Voice Synthesis:** ElevenLabs API integration
- **Database Migrations:** Encore.ts migration system

### AI & ML
- **Conversational AI** - Context-aware chat responses
- **Meal Planning** - AI-generated nutrition plans
- **Journal Insights** - Automated trend analysis
- **Voice Synthesis** - Multiple voice personalities

---

## 🏗️ Architecture

### Project Structure

```
hi-emma-MVP/
├── backend/                    # Encore.ts backend services
│   ├── admin_auth/            # Admin authentication
│   ├── admin_portal/          # Admin dashboard endpoints
│   ├── auth/                  # User authentication (Clerk)
│   ├── care_team/             # Care team management
│   ├── conversation/          # Chat & AI interactions
│   ├── db/                    # Database & migrations
│   ├── email/                 # Email notifications
│   ├── journey/               # Progress & milestones
│   ├── morning/               # Morning routine tracking
│   ├── notifications/         # Multi-channel notifications
│   ├── onboarding/            # User onboarding flow
│   ├── patient_sharing/       # Provider data sharing
│   ├── profile/               # User profiles & preferences
│   ├── provider_auth/         # Provider authentication
│   ├── provider_portal/       # Provider dashboard endpoints
│   ├── push/                  # Push notification service
│   ├── twilio/                # SMS integration
│   ├── voice/                 # Text-to-speech
│   ├── wellness/              # Nutrition & wellness tracking
│   └── wellness_journal/      # Journal entries & insights
│
├── frontend/                   # React + Vite frontend
│   ├── components/            # Reusable components
│   │   ├── views/            # Main application views
│   │   ├── provider/         # Provider portal components
│   │   └── ui/               # shadcn/ui components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities & helpers
│   ├── public/               # Static assets + service worker
│   ├── App.tsx               # Main application component
│   ├── AdminPortalApp.tsx    # Admin portal app
│   └── ProviderPortalApp.tsx # Provider portal app
│
└── docs/                      # Documentation files
    ├── AUTHENTICATION_SETUP.md
    ├── LEAP_NOTIFICATIONS_GUIDE.md
    └── SERVICE_WORKER_FIXES.md
```

### Backend Services

Each backend service is independently deployable with its own:
- **encore.service.ts** - Service definition
- **API endpoints** - Type-safe REST APIs
- **Database access** - SQL queries with type safety
- **Business logic** - Domain-specific operations

**Key Services:**
1. **auth** - User authentication and session management
2. **conversation** - AI chat with memory and context
3. **morning** - Morning routine tracking and analytics
4. **wellness** - Nutrition, meal plans, mood tracking
5. **notifications** - Multi-channel notification delivery
6. **push** - Web push notification infrastructure
7. **provider_portal** - Healthcare provider features
8. **admin_portal** - System administration

### Database Architecture

**32 Migration Files** covering:
- User profiles and authentication
- Morning routine tracking
- Wellness and nutrition data
- Conversation history and memory
- Notification preferences
- Provider and care team access
- Journal entries and chapters
- Push subscriptions
- Admin and audit logs

All migrations are version-controlled and automatically applied by Encore.ts.

### Frontend Architecture

**Three Separate Applications:**
1. **Patient App** (`App.tsx`) - Main user experience
2. **Provider Portal** (`ProviderPortalApp.tsx`) - Healthcare provider interface
3. **Admin Portal** (`AdminPortalApp.tsx`) - System administration

**18 Main Views:**
- Morning Routine, Wellness Journal, Diet & Nutrition
- Mood Tracking, Notifications, Progress
- Care Team, Provider Access, Milestones
- Doctor's Orders, Evening Routine, Memories
- Insights, Help, Settings, Export
- Weekly Meal Plan, Shared Reports

---

## 🚀 Getting Started

### Prerequisites

- **Bun** (latest version) - Package manager and runtime
- **Leap.new Account** - For hosting and deployment
- **Clerk Account** (optional) - For authentication
- **ElevenLabs API Key** (optional) - For voice synthesis
- **Twilio Account** (optional) - For SMS notifications

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hi-emma-MVP.git
   cd hi-emma-MVP
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend
   bun install

   # Install backend dependencies
   cd ../backend
   bun install
   ```

3. **Set up environment variables**
   
   In Leap Settings, add the following secrets:
   
   ```
   # Push Notifications (Required for browser push)
   VAPIDPublicKey=your_vapid_public_key
   VAPIDPrivateKey=your_vapid_private_key
   VAPIDEmail=mailto:your-email@example.com
   
   # Clerk Authentication (Optional)
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   
   # ElevenLabs Voice (Optional)
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   
   # Twilio SMS (Optional)
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. **Generate VAPID Keys** (for push notifications)
   ```bash
   npx web-push generate-vapid-keys
   ```
   Copy the output and add to Leap Settings.

5. **Run the application**
   
   Leap automatically builds and deploys your app when you push to GitHub.
   
   **Local development:**
   - Frontend: Served via Vite dev server
   - Backend: Managed by Encore.ts runtime
   - Database: PostgreSQL instance auto-provisioned

### First-Time Setup

1. **Access the app** at your Leap preview URL
2. **Create an account** via the onboarding flow
3. **Complete onboarding:**
   - Set your name and preferences
   - Configure notification settings
   - Set up morning routine preferences
   - Grant microphone permission (for voice chat)
4. **Set up push notifications:**
   - Go to Settings → Notifications
   - Toggle "Push Notifications" ON
   - Allow browser permission when prompted
   - Test with "Send Test Notification" button

---

## ⚙️ Configuration

### Push Notifications Setup

See [LEAP_NOTIFICATIONS_GUIDE.md](LEAP_NOTIFICATIONS_GUIDE.md) for detailed setup instructions.

**Quick Setup:**
1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Add keys to Leap Settings (VAPIDPublicKey, VAPIDPrivateKey, VAPIDEmail)
3. Service worker automatically registers on app load
4. Users can subscribe via Notifications view

### Voice Configuration

**Available Voices:**
- Trinity (The Matrix character) - Default
- Rachel (Standard female voice)
- Adam (Standard male voice)
- Custom ElevenLabs voices (with API key)

Set voice preference in Settings → Voice Preference.

### SMS Notifications

1. Create Twilio account
2. Get phone number
3. Add credentials to Leap Settings
4. Users can enable SMS in Notifications view

---

## 📚 Features Deep Dive

### Morning Routine System

**Components:**
- **Check-In** - Quick status update to start the day
- **Activities** - Log exercise, meditation, water intake
- **Mood** - Track emotional state with context
- **Journal** - Reflective writing
- **Statistics** - Completion rates, streaks, trends

**API Endpoints:**
- `GET /morning/routine-history` - Historical data
- `POST /morning/check-in` - Log daily check-in
- `POST /morning/add-activity` - Add activity to today
- `POST /morning/add-journal-entry` - Add journal entry
- `GET /morning/stats` - Completion statistics

### Wellness Journal

**Features:**
- Auto-generated daily summaries from activities
- Chapter organization (group entries by theme)
- AI-generated insights per chapter
- Trend analysis across time periods
- Manual entry creation
- PDF export of journal

**How It Works:**
1. **Daily Cron** runs at midnight
2. **Aggregates** all activities from the day
3. **AI generates** a natural language summary
4. **Creates** journal entry automatically
5. **Links** to relevant chapters
6. **Analyzes** trends when chapter completed

### Nutrition & Meal Planning

**Workflow:**
1. **Set Diet Preferences** - Choose dietary restrictions and goals
2. **Generate Meal Plan** - AI creates 7-day plan with recipes
3. **Get Shopping List** - Auto-generated from meal plan ingredients
4. **Track Intake** - Log meals and calculate macros
5. **Chat with Emma** - Ask nutrition questions
6. **Adjust Plan** - Modify meals, swap recipes

**Data Tracked:**
- Calories, protein, carbs, fats
- Meal timing
- Dietary compliance
- Food preferences
- Recipe ratings

### Care Team Management

**Who Can Be Added:**
- Family members
- Friends
- Caregivers
- Healthcare providers
- Therapists
- Nutritionists

**Permissions:**
- View health summaries
- Receive email updates
- No data modification
- Revocable access

---

## 👨‍⚕️ Admin & Provider Portals

### Provider Portal Features

**Access:**
- Separate login at `/provider-portal`
- Authenticated via JWT
- Role-based permissions

**Capabilities:**
- View granted patient data
- Add clinical notes
- Send secure messages
- Review medication adherence
- Monitor vital trends
- Export health reports

**Audit Compliance:**
- Every access logged
- Timestamps recorded
- User agent tracked
- Action type logged
- HIPAA-ready audit trail

### Admin Portal Features

**Access:**
- Separate login at `/admin-portal`
- Super-user credentials required

**Capabilities:**
- User management (view, deactivate)
- System statistics
- Access logs across all users
- Bulk data export
- Password resets
- Usage analytics

---

## 📡 API Documentation

### Authentication

All endpoints use one of three auth methods:
1. **No Auth** (`auth: false`) - Public endpoints
2. **User Auth** (Clerk JWT) - Patient endpoints
3. **Provider Auth** (JWT) - Provider portal endpoints
4. **Admin Auth** (JWT) - Admin portal endpoints

### Type Safety

Frontend API calls are **100% type-safe** via auto-generated client:

```typescript
import backend from '~backend/client';

// Type-safe API call
const response = await backend.morning.checkIn({
  userId: 'user_1',
  mood: 'great',
  energy_level: 8
});
// response type is automatically inferred
```

### Key Endpoints

**Morning Routine:**
- `GET /morning/routine-history/:userId`
- `POST /morning/check-in`
- `POST /morning/add-activity`
- `GET /morning/stats/:userId`

**Wellness & Nutrition:**
- `POST /wellness/generate-meal-plan`
- `GET /wellness/meal-plan/:userId/:weekStart`
- `POST /wellness/nutrition-chat`
- `POST /wellness/save-shopping-list`

**Notifications:**
- `GET /notifications/preferences/:userId`
- `PUT /notifications/preferences`
- `POST /notifications/send`

**Push Notifications:**
- `GET /push/public-key`
- `POST /push/subscribe`
- `POST /push/send`
- `POST /push/unsubscribe`

**Conversation:**
- `POST /conversation/chat`
- `GET /conversation/history/:userId`
- `POST /conversation/memory`

**Journal:**
- `GET /wellness-journal/entries/:userId`
- `POST /wellness-journal/add-manual`
- `GET /wellness-journal/chapters/:userId`
- `POST /wellness-journal/generate-summary`

---

## 🗄️ Database Schema

**32 Tables** including:
- `users` - User accounts
- `user_profiles` - Demographic and preference data
- `morning_routine_logs` - Daily check-ins
- `morning_routine_journal` - Journal entries
- `wellness_journal_entries` - Automated summaries
- `wellness_journal_chapters` - Grouped entries
- `notification_preferences` - User notification settings
- `push_subscriptions` - Browser push endpoints
- `conversation_sessions` - Chat history
- `conversation_memory` - Long-term context
- `weekly_meal_plans` - Nutrition planning
- `diet_preferences` - Dietary restrictions
- `care_team_members` - Family and provider access
- `provider_notes` - Clinical notes
- `admin_logs` - System audit trail
- And more...

All schemas are version-controlled via Encore.ts migrations in `/backend/db/migrations/`.

---

## 🚢 Deployment

### Automatic Deployment (Leap.new)

1. Push to GitHub `main` branch
2. Leap automatically:
   - Detects changes
   - Runs builds (frontend + backend)
   - Applies database migrations
   - Deploys to preview environment
   - Updates live URLs

### Manual Deployment

```bash
# Build frontend
cd frontend
bun run build

# Deploy backend (via Encore.ts CLI)
cd backend
encore deploy

# Or let Leap handle it automatically
git push origin main
```

### Environment-Specific Configuration

- **Development:** Local Encore.ts runtime
- **Preview:** Leap auto-deploys on every push
- **Production:** (Configure via Leap dashboard)

---

## 🧪 Testing

**Test Notifications:**
```typescript
await backend.push.sendPush({
  userId: 'user_1',
  title: '👋 Test from Emma',
  body: 'Your notifications are working!',
  url: '/'
});
```

**Test Voice:**
- Go to Settings → Voice Preference
- Select voice
- Click "Test Voice"

**Test AI Chat:**
- Open conversation view
- Type: "How can you help me?"
- Emma responds with capabilities

---

## 🤝 Contributing

This is a private project, but if you're a collaborator:

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Make changes
3. Test locally
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Leap auto-deploys preview
7. Review and merge to `main`

---

## 📄 License

Private & Proprietary - All Rights Reserved

---

## 📞 Support

For questions or issues:
- Check `/docs` folder for detailed guides
- Review Encore.ts documentation: https://encore.dev/docs
- Review Leap.new documentation: https://leap.new/docs

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Apple Health integration
- [ ] Fitbit / Garmin sync
- [ ] Group chat with care team
- [ ] Video consultations
- [ ] Medication scanning (OCR)
- [ ] Lab result integration
- [ ] Wearable device sync
- [ ] Multi-language support

---

## 🙏 Acknowledgments

Built with:
- **Encore.ts** - Backend framework
- **Leap.new** - Deployment platform
- **Clerk** - Authentication
- **shadcn/ui** - UI components
- **Tailwind CSS** - Styling
- **React** - Frontend framework
- **ElevenLabs** - Voice synthesis
- **Twilio** - SMS notifications

---

**Made with ❤️ for better health and wellness**
