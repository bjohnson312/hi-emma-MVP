import type {
  ApiResponse,
  ProviderAuthResponse,
  ProviderPatient,
  PatientData,
  ProviderNote,
  CreateNoteRequest,
  ProviderMessage,
  SendMessageRequest,
  AuditLog,
} from '../types';

export const providerRoutes = {
  login: async (req: { email: string; password: string }): Promise<ApiResponse<ProviderAuthResponse>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Provider login not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  signup: async (req: { email: string; password: string; name: string }): Promise<ApiResponse<ProviderAuthResponse>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Provider signup not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getPatients: async (): Promise<ApiResponse<ProviderPatient[]>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get provider patients not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getPatient: async (id: string): Promise<ApiResponse<ProviderPatient>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get provider patient not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getPatientData: async (id: string): Promise<ApiResponse<PatientData>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get patient data not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  createNote: async (req: CreateNoteRequest): Promise<ApiResponse<ProviderNote>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Create note not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getNotes: async (patientId: string): Promise<ApiResponse<ProviderNote[]>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get notes not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  sendMessage: async (req: SendMessageRequest): Promise<ApiResponse<ProviderMessage>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Send message not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getMessages: async (patientId: string): Promise<ApiResponse<ProviderMessage[]>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get messages not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getAuditLogs: async (): Promise<ApiResponse<AuditLog[]>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get audit logs not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
};
