export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  expiresAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  expiresAt: string;
}

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
}
