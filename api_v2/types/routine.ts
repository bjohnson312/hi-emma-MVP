export type RoutineType = 'morning' | 'evening';

export interface RoutineTemplate {
  id: string;
  name: string;
  type: RoutineType;
  activities: Activity[];
  estimatedDuration: number;
  description?: string;
}

export interface Activity {
  id: string;
  name: string;
  description?: string;
  duration: number;
  order: number;
  optional: boolean;
}

export interface RoutinePreferences {
  morningTime?: string;
  eveningTime?: string;
  templateId?: string;
  customActivities?: string[];
  reminderEnabled: boolean;
  reminderTime?: number;
}

export interface StartRoutineRequest {
  type: RoutineType;
  templateId?: string;
  customActivities?: string[];
}

export interface StartRoutineResponse {
  sessionId: string;
  currentStep: RoutineStep;
  totalSteps: number;
  progress: number;
}

export interface RoutineStep {
  id: string;
  type: 'question' | 'activity' | 'reflection' | 'mood_check';
  prompt: string;
  expectedInput: 'text' | 'voice' | 'scale' | 'choice' | 'boolean';
  choices?: string[];
  scaleRange?: {
    min: number;
    max: number;
    labels?: Record<number, string>;
  };
  metadata?: Record<string, any>;
}

export interface NextStepRequest {
  sessionId: string;
  response: StepResponse;
}

export interface StepResponse {
  type: string;
  value: any;
  timestamp?: string;
}

export interface NextStepResponse {
  nextStep?: RoutineStep;
  isComplete: boolean;
  summary?: RoutineSummary;
  progress: number;
}

export type SleepQualityLabel = 'poor' | 'fair' | 'good' | 'great' | 'excellent';

export interface RoutineSummary {
  sessionId: string;
  type: RoutineType;
  completedAt: string;
  totalDuration: number;
  activities: string[];
  mood?: number;
  sleep_quality_label?: SleepQualityLabel;
  sleep_duration_hours?: number;
  insights?: string[];
  score?: number;
}

export interface RoutineSession {
  id: string;
  userId: string;
  type: RoutineType;
  startedAt: string;
  completedAt?: string;
  currentStepId?: string;
  steps: RoutineStep[];
  responses: Record<string, StepResponse>;
  progress: number;
}

export interface RoutineHistory {
  sessions: RoutineSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface RoutineStats {
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  averageDuration: number;
  completionRate: number;
  recentMoodAverage?: number;
  averageSleepDuration?: number;
  averageSleepQuality?: number;
  topActivities?: string[];
}

export interface TodayCompletion {
  morning?: RoutineSummary;
  evening?: RoutineSummary;
  completed: boolean;
}
