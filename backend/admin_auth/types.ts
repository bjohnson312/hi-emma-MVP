export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  adminId?: string;
  token?: string;
  message?: string;
}
