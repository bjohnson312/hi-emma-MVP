export interface GreetingRequest {
  userId: string;
}

export interface GreetingResponse {
  greeting: string;
  timeOfDay: string;
}

export interface CurrentContextRequest {
  userId: string;
}

export interface CurrentContextResponse {
  greeting: string;
  timeOfDay: string;
  suggestions: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    action: {
      route: string;
      label: string;
      params?: Record<string, any>;
    };
  }>;
  activeSession?: {
    id: string;
    type: string;
    canResume: boolean;
    lastMessageAt: string;
    messageCount: number;
  } | null;
}

export interface ConversationStartRequest {
  sessionType: "general" | "morning" | "evening" | "nutrition" | "mood";
  isFirstCheckIn: boolean;
  userId: string;
}

export interface ConversationStartResponse {
  sessionId: string;
  greeting: string;
  timeOfDay: string;
}

export interface ConversationSendRequest {
  sessionId: string;
  message: string;
  sessionType: string;
  userId: string;
}

export interface ConversationSendResponse {
  response: string;
  suggestedActions?: Array<{
    id: string;
    label: string;
    action: string;
    params?: Record<string, any>;
  }>;
  emotionalTone?: string;
  context?: Record<string, any>;
  sessionId: string;
}
