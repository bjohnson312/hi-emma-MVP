export interface EveningRoutineLog {
  id: number;
  user_id: string;
  date: Date;
  wind_down_activities?: string[];
  screen_time_minutes?: number;
  dinner_time?: string;
  bedtime?: string;
  notes?: string;
  created_at: Date;
}

export interface LogEveningRoutineRequest {
  user_id: string;
  wind_down_activities?: string[];
  screen_time_minutes?: number;
  dinner_time?: string;
  bedtime?: string;
  notes?: string;
}

export interface DoctorsOrder {
  id: number;
  user_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  time_of_day: string[];
  start_date: Date;
  end_date?: Date;
  prescribing_doctor?: string;
  notes?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDoctorsOrderRequest {
  user_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  time_of_day: string[];
  start_date: Date;
  end_date?: Date;
  prescribing_doctor?: string;
  notes?: string;
}

export interface MedicationLog {
  id: number;
  user_id: string;
  doctors_order_id?: number;
  taken_at: Date;
  scheduled_time?: Date;
  notes?: string;
  created_at: Date;
}

export interface LogMedicationRequest {
  user_id: string;
  doctors_order_id?: number;
  scheduled_time?: Date;
  notes?: string;
}

export interface DietNutritionLog {
  id: number;
  user_id: string;
  date: Date;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  meal_time?: string;
  description: string;
  water_intake_oz?: number;
  energy_level?: number;
  notes?: string;
  created_at: Date;
}

export interface LogMealRequest {
  user_id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  meal_time?: string;
  description: string;
  water_intake_oz?: number;
  energy_level?: number;
  notes?: string;
}

export interface MoodLog {
  id: number;
  user_id: string;
  date: Date;
  mood_rating: number;
  mood_tags?: string[];
  energy_level?: number;
  stress_level?: number;
  notes?: string;
  triggers?: string;
  created_at: Date;
}

export interface LogMoodRequest {
  user_id: string;
  mood_rating: number;
  mood_tags?: string[];
  energy_level?: number;
  stress_level?: number;
  notes?: string;
  triggers?: string;
}

export interface GetLogsRequest {
  user_id: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
}
