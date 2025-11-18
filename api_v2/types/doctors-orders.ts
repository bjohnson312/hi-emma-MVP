export type DoctorOrderType = 'medication' | 'exercise' | 'dietary' | 'other';

export interface DoctorOrder {
  id: string;
  userId: string;
  type: DoctorOrderType;
  title: string;
  description: string;
  frequency?: string;
  startDate: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Medication extends DoctorOrder {
  dosage: string;
  unit: string;
  schedule: MedicationSchedule[];
  refillDate?: string;
  prescribingDoctor?: string;
}

export interface MedicationSchedule {
  time: string;
  days: number[];
  withFood?: boolean;
  instructions?: string;
}

export interface CreateDoctorOrderRequest {
  type: DoctorOrderType;
  title: string;
  description: string;
  frequency?: string;
  startDate: string;
  endDate?: string;
}

export interface CreateMedicationRequest extends CreateDoctorOrderRequest {
  dosage: string;
  unit: string;
  schedule: MedicationSchedule[];
  refillDate?: string;
  prescribingDoctor?: string;
}

export interface UpdateDoctorOrderRequest {
  title?: string;
  description?: string;
  frequency?: string;
  endDate?: string;
  active?: boolean;
}

export interface LogDoseRequest {
  takenAt: string;
  skipped?: boolean;
  notes?: string;
}

export interface DoseLog {
  id: string;
  medicationId: string;
  scheduledTime: string;
  takenAt?: string;
  skipped: boolean;
  notes?: string;
  loggedAt: string;
}

export interface AdherenceStats {
  medicationId: string;
  period: 'week' | 'month' | 'all';
  totalScheduled: number;
  totalTaken: number;
  totalSkipped: number;
  adherenceRate: number;
  recentLogs: DoseLog[];
}
