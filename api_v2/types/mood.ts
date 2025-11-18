export interface LogMoodRequest {
  mood: number;
  intensity?: number;
  notes?: string;
  triggers?: string[];
  activities?: string[];
}

export interface MoodEntry {
  id: string;
  userId: string;
  mood: number;
  intensity?: number;
  notes?: string;
  triggers?: string[];
  activities?: string[];
  loggedAt: string;
}

export interface MoodHistory {
  entries: MoodEntry[];
  total: number;
  averageMood: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface MoodInsights {
  patterns: MoodPattern[];
  recommendations: string[];
  alerts?: Alert[];
}

export interface MoodPattern {
  type: 'weekly' | 'trigger' | 'activity' | 'temporal' | 'correlation';
  description: string;
  confidence: number;
  data: any;
  detectedAt: string;
}

export interface Alert {
  id: string;
  type: 'concern' | 'info' | 'achievement';
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface MoodTrends {
  daily: TrendData[];
  weekly: TrendData[];
  monthly: TrendData[];
  topTriggers: TriggerFrequency[];
  topActivities: ActivityFrequency[];
}

export interface TrendData {
  date: string;
  average: number;
  count: number;
  high: number;
  low: number;
}

export interface TriggerFrequency {
  trigger: string;
  count: number;
  averageMood: number;
}

export interface ActivityFrequency {
  activity: string;
  count: number;
  averageMood: number;
}
