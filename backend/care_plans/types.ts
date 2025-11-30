export interface CarePlan {
  id: number;
  user_id: string;
  name: string;
  condition_key?: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CarePlanItem {
  id: number;
  care_plan_id: number;
  type: "medication" | "activity" | "measurement" | "other";
  label: string;
  details?: ItemDetails;
  frequency: string;
  times_of_day?: string[];
  days_of_week?: number[];
  reminder_enabled: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export type ItemDetails = Record<string, any>;

export interface CarePlanCompletion {
  id: number;
  user_id: string;
  care_plan_id: number;
  completion_date: Date;
  completed_item_ids: number[];
  all_completed: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCarePlanRequest {
  user_id: string;
  name: string;
  condition_key?: string;
  description?: string;
}

export interface UpdateCarePlanRequest {
  plan_id: number;
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface DeleteCarePlanRequest {
  plan_id: number;
}

export interface GetUserPlansRequest {
  user_id: string;
}

export interface GetUserPlansResponse {
  plans: CarePlan[];
}

export interface CreateCarePlanItemRequest {
  care_plan_id: number;
  type: "medication" | "activity" | "measurement" | "other";
  label: string;
  details?: ItemDetails;
  frequency: string;
  times_of_day?: string[];
  days_of_week?: number[];
  reminder_enabled?: boolean;
  sort_order?: number;
}

export interface UpdateCarePlanItemRequest {
  item_id: number;
  label?: string;
  details?: ItemDetails;
  frequency?: string;
  times_of_day?: string[];
  days_of_week?: number[];
  reminder_enabled?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export interface DeleteCarePlanItemRequest {
  item_id: number;
}

export interface GetPlanItemsRequest {
  care_plan_id: number;
}

export interface GetPlanItemsResponse {
  items: CarePlanItem[];
}

export interface GetTodayTasksRequest {
  user_id: string;
}

export interface TodayTask {
  item: CarePlanItem;
  completed: boolean;
  scheduled_time?: string;
}

export interface GetTodayTasksResponse {
  tasks: TodayTask[];
  total_count: number;
  completed_count: number;
}

export interface MarkItemCompleteRequest {
  user_id: string;
  item_id: number;
  completed: boolean;
  notes?: string;
}

export interface GetCompletionsRequest {
  user_id: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
}

export interface GetCompletionsResponse {
  completions: CarePlanCompletion[];
}

export interface GetStatsRequest {
  user_id: string;
  days?: number;
}

export interface GetStatsResponse {
  total_completions: number;
  completion_rate: number;
  current_streak: number;
  longest_streak: number;
}

export interface CarePlanPreset {
  key: string;
  name: string;
  description: string;
  icon: string;
  items: Omit<CreateCarePlanItemRequest, 'care_plan_id'>[];
}

export interface GenerateAIPlanRequest {
  user_id: string;
  condition: string;
  user_context?: string;
}

export interface GenerateAIPlanResponse {
  plan_name: string;
  description: string;
  items: Omit<CreateCarePlanItemRequest, 'care_plan_id'>[];
  disclaimer: string;
}
