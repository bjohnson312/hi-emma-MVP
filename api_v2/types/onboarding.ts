export interface OnboardingStatus {
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  progress: number;
  isComplete: boolean;
  nextStep?: OnboardingStep;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  fields: StepField[];
  order: number;
}

export interface StepField {
  name: string;
  type: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'date' | 'time';
  label: string;
  required: boolean;
  options?: string[];
  validation?: FieldValidation;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface CompleteStepRequest {
  data: Record<string, any>;
}

export interface CompleteStepResponse {
  nextStep?: OnboardingStep;
  overallProgress: number;
  isComplete: boolean;
}

export interface UpdateStepRequest {
  data: Record<string, any>;
}
