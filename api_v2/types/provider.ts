export interface Provider {
  id: string;
  email: string;
  name: string;
  specialty?: string;
  licenseNumber?: string;
  createdAt: string;
}

export interface ProviderAuthResponse {
  provider: Provider;
  token: string;
  expiresAt: string;
}

export interface ProviderPatient {
  id: string;
  name: string;
  email: string;
  lastActivity: string;
  accessGrantedAt: string;
  accessLevel: 'read' | 'write';
}

export interface PatientData {
  profile: any;
  routines?: any[];
  mood?: any[];
  journal?: any[];
  medications?: any[];
  appointments?: any[];
}

export interface ProviderNote {
  id: string;
  providerId: string;
  patientId: string;
  content: string;
  category: string;
  createdAt: string;
}

export interface CreateNoteRequest {
  patientId: string;
  content: string;
  category: string;
}

export interface ProviderMessage {
  id: string;
  providerId: string;
  patientId: string;
  message: string;
  sentAt: string;
  read: boolean;
}

export interface SendMessageRequest {
  patientId: string;
  message: string;
}

export interface AuditLog {
  id: string;
  providerId: string;
  patientId: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress?: string;
}
