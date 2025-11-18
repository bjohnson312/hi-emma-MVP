export interface Chapter {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  sections: Section[];
  entryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  chapterId: string;
  title: string;
  description?: string;
  order: number;
  completed: boolean;
  completedAt?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  chapterId?: string;
  sectionId?: string;
  content: string;
  type: 'auto' | 'manual';
  mood?: number;
  tags?: string[];
  createdAt: string;
  sourceConversationId?: string;
  metadata?: Record<string, any>;
}

export interface CreateChapterRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  sections?: CreateSectionRequest[];
}

export interface CreateSectionRequest {
  title: string;
  description?: string;
  order: number;
}

export interface UpdateChapterRequest {
  title?: string;
  description?: string;
  endDate?: string;
}

export interface UpdateSectionRequest {
  title?: string;
  description?: string;
  completed?: boolean;
}

export interface CreateEntryRequest {
  chapterId?: string;
  sectionId?: string;
  content: string;
  mood?: number;
  tags?: string[];
}

export interface AutoCreateEntryRequest {
  conversationId: string;
  content: string;
}

export interface ChapterInsights {
  chapterId: string;
  insights: Insight[];
  trends: Trend[];
  generatedAt: string;
}

export interface Insight {
  type: 'pattern' | 'achievement' | 'concern' | 'suggestion';
  title: string;
  description: string;
  confidence: number;
  data?: any;
}

export interface Trend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change: number;
  period: string;
}

export interface DailySummary {
  date: string;
  highlights: string[];
  moodSummary?: {
    average: number;
    high: number;
    low: number;
  };
  activities: string[];
  entryCount: number;
  generatedText?: string;
}

export interface ExportRequest {
  type: 'pdf' | 'json';
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  includeInsights?: boolean;
  chapterIds?: string[];
}

export interface ExportResponse {
  exportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface Export {
  id: string;
  userId: string;
  type: 'pdf' | 'json';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: string;
  createdAt: string;
}
