export interface PatientAccessRequest {
  patientUserId: string;
  accessLevel: "read" | "write" | "full";
  expiresAt?: Date;
}

export interface ProviderNoteRequest {
  patientUserId: string;
  noteType: "observation" | "recommendation" | "order" | "followup" | "general";
  subject: string;
  content: string;
  priority?: "low" | "normal" | "high" | "urgent";
  isVisibleToPatient?: boolean;
}

export interface ProviderNote {
  id: string;
  providerId: string;
  providerName: string;
  patientUserId: string;
  noteType: string;
  subject: string;
  content: string;
  priority: string;
  isVisibleToPatient: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRequest {
  patientUserId: string;
  message: string;
}

export interface Message {
  id: string;
  providerId?: string;
  providerName?: string;
  patientUserId: string;
  senderType: "provider" | "patient";
  message: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface PatientWellnessData {
  patientId: string;
  patientName: string;
  morningCheckIns: any[];
  moodEntries: any[];
  wellnessJournal: any[];
  recentInsights: any[];
}
