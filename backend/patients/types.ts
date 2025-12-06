export interface Patient {
  id: string;
  created_by_provider_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: Date;
  medical_record_number?: string;
  address?: string;
  user_id?: string;
  notes?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePatientRequest {
  token: string;
  full_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  medical_record_number?: string;
  address?: string;
  notes?: string;
}

export interface CreatePatientResponse {
  patient: Patient;
}

export interface UpdatePatientRequest {
  token: string;
  patient_id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  medical_record_number?: string;
  address?: string;
  notes?: string;
}

export interface UpdatePatientResponse {
  patient: Patient;
}

export interface DeletePatientRequest {
  token: string;
  patient_id: string;
  permanent?: boolean;
}

export interface DeletePatientResponse {
  success: boolean;
}

export interface GetPatientRequest {
  token: string;
  patient_id: string;
}

export interface GetPatientResponse {
  patient: Patient;
}

export interface ListPatientsRequest {
  token: string;
  include_inactive?: boolean;
  search?: string;
}

export interface PatientListItem {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  medical_record_number?: string;
  user_id?: string;
  has_app_access: boolean;
  last_activity?: Date;
  created_at: Date;
}

export interface ListPatientsResponse {
  patients: PatientListItem[];
}

export interface LinkUserRequest {
  token: string;
  patient_id: string;
  user_id: string;
}

export interface LinkUserResponse {
  patient: Patient;
}
