export type TaskType = "medication" | "activity" | "measurement" | "habit";

export interface CarePlanTask {
  id?: number;
  care_plan_id?: number;
  label: string;
  type: TaskType;
  frequency: string;
  time_of_day?: string;
  reminder_enabled: boolean;
  order_index: number;
  is_active: boolean;
}

export interface CarePlan {
  id?: number;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface CarePlanWithTasks extends CarePlan {
  tasks: CarePlanTask[];
}

export interface TaskCompletion {
  id?: number;
  user_id: string;
  task_id: number;
  completion_date: Date;
  notes?: string;
  created_at?: Date;
}

export interface CreatePlanRequest {
  user_id: string;
  name: string;
  description?: string;
  tasks: Omit<CarePlanTask, 'id' | 'care_plan_id' | 'is_active'>[];
}

export interface CreatePlanResponse {
  plan: CarePlanWithTasks;
}

export interface GetUserPlanRequest {
  user_id: string;
}

export interface GetUserPlanResponse {
  plan: CarePlanWithTasks | null;
}

export interface AddTaskRequest {
  care_plan_id: number;
  task: Omit<CarePlanTask, 'id' | 'care_plan_id' | 'is_active'>;
}

export interface AddTaskResponse {
  task: CarePlanTask;
}

export interface UpdateTaskRequest {
  task_id: number;
  updates: Partial<Omit<CarePlanTask, 'id' | 'care_plan_id'>>;
}

export interface UpdateTaskResponse {
  task: CarePlanTask;
}

export interface MarkTaskCompleteRequest {
  user_id: string;
  task_id: number;
  notes?: string;
}

export interface MarkTaskCompleteResponse {
  completion: TaskCompletion;
  already_complete: boolean;
}

export interface GetTodayTasksRequest {
  user_id: string;
}

export interface TodayTask extends CarePlanTask {
  completed: boolean;
}

export interface GetTodayTasksResponse {
  tasks: TodayTask[];
  completed_count: number;
  total_count: number;
}

export interface GenerateAIPlanRequest {
  condition: string;
}

export interface GenerateAIPlanResponse {
  tasks: Omit<CarePlanTask, 'id' | 'care_plan_id' | 'is_active' | 'order_index' | 'reminder_enabled'>[];
}
