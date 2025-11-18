import type {
  RoutineTemplate,
  RoutinePreferences,
  StartRoutineRequest,
  StartRoutineResponse,
  NextStepRequest,
  NextStepResponse,
  RoutineSession,
  RoutineHistory,
  RoutineStats,
  TodayCompletion,
} from '../types';

export class RoutineService {
  async getTemplates(): Promise<RoutineTemplate[]> {
    throw new Error('getTemplates() not implemented');
  }

  async getPreferences(userId: string): Promise<RoutinePreferences> {
    throw new Error('getPreferences() not implemented');
  }

  async updatePreferences(userId: string, prefs: RoutinePreferences): Promise<RoutinePreferences> {
    throw new Error('updatePreferences() not implemented');
  }

  async startRoutine(userId: string, req: StartRoutineRequest): Promise<StartRoutineResponse> {
    throw new Error('startRoutine() not implemented');
  }

  async nextStep(userId: string, req: NextStepRequest): Promise<NextStepResponse> {
    throw new Error('nextStep() not implemented');
  }

  async getSession(userId: string, sessionId: string): Promise<RoutineSession> {
    throw new Error('getSession() not implemented');
  }

  async completeRoutine(userId: string, sessionId: string): Promise<void> {
    throw new Error('completeRoutine() not implemented');
  }

  async getHistory(userId: string, page: number, limit: number): Promise<RoutineHistory> {
    throw new Error('getHistory() not implemented');
  }

  async getStats(userId: string): Promise<RoutineStats> {
    throw new Error('getStats() not implemented');
  }

  async getTodayCompletion(userId: string): Promise<TodayCompletion> {
    throw new Error('getTodayCompletion() not implemented');
  }
}

export const routineService = new RoutineService();
