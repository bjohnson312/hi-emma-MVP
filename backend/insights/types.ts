export type IntentType = 
  | "morning_routine" 
  | "evening_routine" 
  | "diet_nutrition" 
  | "doctors_orders" 
  | "mood" 
  | "symptoms"
  | "wellness_general";

export type InsightStatus = "pending" | "applied" | "dismissed";

export interface DetectedInsight {
  id: string;
  sessionId: number;
  userId: string;
  intentType: IntentType;
  extractedData: Record<string, any>;
  confidence: number;
  emmaSuggestionText?: string;
  status: InsightStatus;
  createdAt: Date;
  appliedAt?: Date;
  dismissedAt?: Date;
}

export interface IntentDetectionRequest {
  sessionId: number;
  userId: string;
  userMessage: string;
  emmaResponse: string;
}

export interface IntentDetectionResponse {
  insights: DetectedInsight[];
}

export interface GetSuggestionsRequest {
  sessionId?: number;
  userId: string;
  status?: InsightStatus;
}

export interface GetSuggestionsResponse {
  suggestions: DetectedInsight[];
}

export interface ApplySuggestionRequest {
  suggestionId: string;
  userId: string;
}

export interface ApplySuggestionResponse {
  success: boolean;
  message: string;
}

export interface DismissSuggestionRequest {
  suggestionId: string;
  userId: string;
}

export interface DismissSuggestionResponse {
  success: boolean;
}

export interface RoutineCompletion {
  morningCompleted: boolean;
  eveningCompleted: boolean;
  dietSetupComplete: boolean;
  doctorsOrdersCount: number;
}
