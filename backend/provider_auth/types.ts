export type ProviderRole = "provider" | "admin" | "nurse" | "specialist";
export type AccessLevel = "read" | "write" | "full";

export interface ProviderAuthParams {
  email: string;
  password: string;
}

export interface ProviderSignupParams {
  email: string;
  password: string;
  fullName: string;
  credentials?: string;
  specialty?: string;
  organization?: string;
  licenseNumber?: string;
}

export interface ProviderAuthResponse {
  token: string;
  providerId: string;
  email: string;
  fullName: string;
  role: ProviderRole;
}

export interface Provider {
  id: string;
  email: string;
  fullName: string;
  credentials?: string;
  specialty?: string;
  organization?: string;
  licenseNumber?: string;
  role: ProviderRole;
  isActive: boolean;
  createdAt: Date;
}
