export type CareTeamMemberType =
  | "family"
  | "caretaker"
  | "primary_care"
  | "specialist"
  | "chiropractor"
  | "physical_therapist"
  | "mental_health"
  | "nutritionist"
  | "personal_trainer"
  | "dentist"
  | "other";

export interface CareTeamMember {
  id: string;
  userId: string;
  memberType: CareTeamMemberType;
  relationship?: string;
  name: string;
  phone?: string;
  email?: string;
  fax?: string;
  specialty?: string;
  organization?: string;
  address?: string;
  notes?: string;
  isPrimary: boolean;
  emailPending: boolean;
  isActive: boolean;
  addedAt: Date;
  updatedAt: Date;
}

export interface CareTeamSetupProgress {
  userId: string;
  currentStep: number;
  totalSteps: number;
  stepsCompleted: string[];
  isCompleted: boolean;
  startedAt: Date;
  completedAt?: Date;
  lastUpdated: Date;
}
