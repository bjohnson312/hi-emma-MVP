export interface CareTeamMember {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  role: string;
  notes?: string;
  addedAt: string;
  updatedAt: string;
}

export interface CreateMemberRequest {
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  role: string;
  notes?: string;
}

export interface UpdateMemberRequest {
  name?: string;
  relationship?: string;
  email?: string;
  phone?: string;
  role?: string;
  notes?: string;
}

export interface CareTeamSetupProgress {
  steps: SetupStep[];
  currentStep: number;
  isComplete: boolean;
  progress: number;
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

export interface ValidateSetupRequest {
  data: Record<string, any>;
}

export interface ValidationResponse {
  isValid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}
