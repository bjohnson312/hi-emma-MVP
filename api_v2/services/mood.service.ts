import type { LogMoodRequest, MoodEntry, MoodHistory, MoodInsights, MoodTrends } from '../types';

export class MoodService {
  async logMood(userId: string, req: LogMoodRequest): Promise<MoodEntry> {
    throw new Error('logMood() not implemented');
  }

  async getHistory(userId: string, startDate?: string, endDate?: string): Promise<MoodHistory> {
    throw new Error('getHistory() not implemented');
  }

  async getInsights(userId: string): Promise<MoodInsights> {
    throw new Error('getInsights() not implemented');
  }

  async getTrends(userId: string, period: 'week' | 'month'): Promise<MoodTrends> {
    throw new Error('getTrends() not implemented');
  }
}

export const moodService = new MoodService();
