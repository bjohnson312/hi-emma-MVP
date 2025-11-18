export interface ProgressSummary {
  overall: number;
  categories: CategoryProgress[];
  milestones: MilestoneSummary;
  streak: StreakInfo;
}

export interface CategoryProgress {
  category: string;
  progress: number;
  goal: number;
  unit: string;
  lastUpdated: string;
}

export interface MilestoneSummary {
  total: number;
  achieved: number;
  recent: Milestone[];
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastActivity: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  category: string;
  achievedAt?: string;
  progress: number;
  target: number;
  icon?: string;
  reward?: string;
}

export interface UpdateProgressRequest {
  category: string;
  value: number;
  incrementBy?: boolean;
}

export interface UpdateProgressResponse {
  updated: CategoryProgress;
  milestonesAwarded?: Milestone[];
}

export interface MilestonesQuery {
  achieved?: boolean;
  category?: string;
}
