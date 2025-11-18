import { authRoutes } from './auth';
import { userRoutes } from './user';
import { onboardingRoutes } from './onboarding';
import { routineRoutes } from './routines';
import { conversationRoutes } from './conversations';
import { moodRoutes } from './mood';
import { nutritionRoutes } from './nutrition';
import { doctorsOrdersRoutes } from './doctors-orders';
import { journalRoutes } from './journal';
import { careTeamRoutes } from './care-team';
import { insightsRoutes } from './insights';
import { progressRoutes } from './progress';
import { notificationsRoutes } from './notifications';
import { speechRoutes } from './speech';
import { providerRoutes } from './provider';
import { adminRoutes } from './admin';

export const apiV2Routes = {
  auth: authRoutes,
  user: userRoutes,
  onboarding: onboardingRoutes,
  routines: routineRoutes,
  conversations: conversationRoutes,
  mood: moodRoutes,
  nutrition: nutritionRoutes,
  doctorsOrders: doctorsOrdersRoutes,
  journal: journalRoutes,
  careTeam: careTeamRoutes,
  insights: insightsRoutes,
  progress: progressRoutes,
  notifications: notificationsRoutes,
  speech: speechRoutes,
  provider: providerRoutes,
  admin: adminRoutes,
};

export * from './auth';
export * from './user';
export * from './onboarding';
export * from './routines';
export * from './conversations';
export * from './mood';
export * from './nutrition';
export * from './doctors-orders';
export * from './journal';
export * from './care-team';
export * from './insights';
export * from './progress';
export * from './notifications';
export * from './speech';
export * from './provider';
export * from './admin';
