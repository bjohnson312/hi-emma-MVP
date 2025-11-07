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
  image_url?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  analyzed?: boolean;
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

export interface NutritionSetupProgress {
  userId: string;
  currentStep: number;
  stepsCompleted: string[];
  isCompleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NutritionChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface StartNutritionChatRequest {
  user_id: string;
}

export interface StartNutritionChatResponse {
  session_id: string;
  initial_message: string;
}

export interface NutritionChatRequest {
  session_id: string;
  user_id: string;
  message: string;
}

export interface NutritionPlan {
  id: number;
  user_id: string;
  plan_name: string;
  goals: string[];
  dietary_preferences?: string;
  calorie_target?: number;
  protein_target_g?: number;
  carbs_target_g?: number;
  fat_target_g?: number;
  meal_suggestions?: any;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface GetNutritionPlanRequest {
  user_id: string;
}

export interface UploadFoodImageRequest {
  user_id: string;
  image_type: "meal" | "refrigerator";
  meal_type?: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface UploadFoodImageResponse {
  upload_url: string;
  image_id: string;
}

export interface AnalyzeFoodImageRequest {
  user_id: string;
  image_id: string;
  image_type: "meal" | "refrigerator";
  meal_type?: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface MealNutritionData {
  description: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  items: string[];
}

export interface RefrigeratorScanData {
  detected_items: string[];
  suggested_meals: Array<{
    name: string;
    description: string;
    ingredients: string[];
    estimated_prep_time: string;
  }>;
}

export interface AnalyzeFoodImageResponse {
  meal_data?: MealNutritionData;
  refrigerator_data?: RefrigeratorScanData;
  image_url: string;
}
