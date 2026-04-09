export interface DayMessage {
  day: number;
  message: string;
}

export interface Challenge {
  id: number;
  created_at: Date;
  updated_at: Date;
  name: string;
  description?: string | null;
  day_messages: DayMessage[];
  send_time: string;
  timezone: string;
  is_active: boolean;
  created_by?: string | null;
}

export interface ChallengeEnrollment {
  id: number;
  created_at: Date;
  challenge_id: number;
  user_id: string;
  phone_number: string;
  start_date: string;
  current_day: number;
  is_active: boolean;
}

export interface ChallengeSend {
  id: number;
  created_at: Date;
  challenge_id: number;
  enrollment_id: number;
  user_id: string;
  phone_number: string;
  day_number: number;
  message_body: string;
  sent_at: Date;
  external_id?: string | null;
  status: string;
  error?: string | null;
  replied_at?: Date | null;
  reply_body?: string | null;
}

export interface CreateChallengeRequest {
  name: string;
  description?: string;
  day_messages: DayMessage[];
  send_time: string;
  timezone?: string;
  enrolled_users: EnrolledUser[];
}

export interface EnrolledUser {
  user_id: string;
  phone_number: string;
}

export interface CreateChallengeResponse {
  success: boolean;
  challenge?: Challenge;
  enrolled_count?: number;
  error?: string;
}

export interface ListChallengesResponse {
  challenges: Challenge[];
  total: number;
}

export interface GetChallengeRequest {
  id: number;
}

export interface UpdateChallengeRequest {
  id: number;
  name?: string;
  description?: string;
  day_messages?: DayMessage[];
  send_time?: string;
  timezone?: string;
  is_active?: boolean;
}

export interface UpdateChallengeResponse {
  success: boolean;
  challenge?: Challenge;
  error?: string;
}

export interface DeleteChallengeRequest {
  id: number;
}

export interface DeleteChallengeResponse {
  success: boolean;
  error?: string;
}

export interface EnrollUsersRequest {
  challenge_id: number;
  users: EnrolledUser[];
  start_date?: string;
}

export interface EnrollUsersResponse {
  success: boolean;
  enrolled_count: number;
  error?: string;
}

export interface UnenrollUserRequest {
  challenge_id: number;
  user_id: string;
}

export interface UnenrollUserResponse {
  success: boolean;
  error?: string;
}

export interface UserProgress {
  user_id: string;
  phone_number: string;
  enrollment_id: number;
  current_day: number;
  start_date: string;
  is_active: boolean;
  sends: DaySendStatus[];
}

export interface DaySendStatus {
  day_number: number;
  status: "pending" | "sent" | "failed" | "not_reached";
  sent_at?: Date | null;
  replied_at?: Date | null;
  reply_body?: string | null;
}

export interface GetChallengeProgressResponse {
  challenge: Challenge;
  total_days: number;
  enrollments: UserProgress[];
}

export interface GetChallengeProgressRequest {
  id: number;
}
