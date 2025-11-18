import type {
  ApiResponse,
  DoctorOrder,
  CreateDoctorOrderRequest,
  UpdateDoctorOrderRequest,
  Medication,
  CreateMedicationRequest,
  LogDoseRequest,
  DoseLog,
  AdherenceStats,
} from '../types';

export const doctorsOrdersRoutes = {
  getOrders: async (): Promise<ApiResponse<DoctorOrder[]>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get doctor orders not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  createOrder: async (req: CreateDoctorOrderRequest): Promise<ApiResponse<DoctorOrder>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Create doctor order not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  updateOrder: async (id: string, req: UpdateDoctorOrderRequest): Promise<ApiResponse<DoctorOrder>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Update doctor order not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  deleteOrder: async (id: string): Promise<ApiResponse<void>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Delete doctor order not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getMedications: async (): Promise<ApiResponse<Medication[]>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get medications not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  createMedication: async (req: CreateMedicationRequest): Promise<ApiResponse<Medication>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Create medication not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  updateMedication: async (id: string, req: Partial<Medication>): Promise<ApiResponse<Medication>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Update medication not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  logDose: async (id: string, req: LogDoseRequest): Promise<ApiResponse<DoseLog>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Log medication dose not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getAdherence: async (id: string, params: { period?: 'week' | 'month' | 'all' }): Promise<ApiResponse<AdherenceStats>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get medication adherence not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
};
