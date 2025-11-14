export interface Appointment {
  id: number;
  provider_id: string;
  patient_id: string;
  appointment_date: Date;
  duration_minutes: number;
  appointment_type: string;
  status: string;
  reason?: string;
  location?: string;
  care_team_role?: string;
  risk_level: string;
  pre_visit_summary_generated: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AppointmentWithPatient extends Appointment {
  patient_name: string;
  patient_age?: number;
}

export interface AppointmentNote {
  id: number;
  appointment_id: number;
  provider_id: string;
  note_type: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  quick_note?: string;
  template_used?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AppointmentSummary {
  id: number;
  appointment_id: number;
  summary_type: string;
  medication_adherence?: Record<string, any>;
  symptom_patterns?: Record<string, any>;
  mood_trends?: Record<string, any>;
  diet_logs?: Record<string, any>;
  routine_completion?: Record<string, any>;
  clinical_risks?: Record<string, any>;
  emma_alerts?: Record<string, any>;
  key_insights: string[];
  generated_at: Date;
}

export interface AppointmentAction {
  id: number;
  appointment_id: number;
  action_type: string;
  description: string;
  assigned_to?: string;
  status: string;
  due_date?: Date;
  completed_at?: Date;
  created_at: Date;
}

export interface ProviderSummaryPreferences {
  id: number;
  provider_id: string;
  default_summary_type: string;
  data_fields: string[];
  lookback_days: number;
  alert_thresholds: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface PatientTimelineEvent {
  id: number;
  patient_id: string;
  event_type: string;
  event_date: Date;
  event_data: Record<string, any>;
  source?: string;
  created_at: Date;
}

export interface GetAppointmentsRequest {
  provider_id: string;
  start_date?: Date;
  end_date?: Date;
  view_type?: 'day' | 'week' | 'month';
  status?: string;
}

export interface GetAppointmentsResponse {
  appointments: AppointmentWithPatient[];
  total_count: number;
  high_risk_count: number;
  alerts_count: number;
}

export interface GetAppointmentDetailRequest {
  appointment_id: number;
  provider_id: string;
}

export interface GetAppointmentDetailResponse {
  appointment: AppointmentWithPatient;
  patient_profile: Record<string, any>;
  summary: AppointmentSummary | null;
  notes: AppointmentNote[];
  actions: AppointmentAction[];
  timeline_events: PatientTimelineEvent[];
}

export interface GenerateSummaryRequest {
  appointment_id: number;
  summary_type: string;
  provider_id: string;
}

export interface CreateNoteRequest {
  appointment_id: number;
  provider_id: string;
  note_type: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  quick_note?: string;
}

export interface CreateActionRequest {
  appointment_id: number;
  action_type: string;
  description: string;
  assigned_to?: string;
  due_date?: Date;
}

export interface DailySummaryRequest {
  provider_id: string;
  date: Date;
}

export interface DailySummaryResponse {
  total_appointments: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  top_alerts: string[];
  essential_actions: AppointmentAction[];
  prep_queue: AppointmentWithPatient[];
}
