import type { SignupRequest, LoginRequest, AuthResponse } from '../types';

export class AuthService {
  async signup(req: SignupRequest): Promise<AuthResponse> {
    throw new Error('signup() not implemented');
  }

  async login(req: LoginRequest): Promise<AuthResponse> {
    throw new Error('login() not implemented');
  }

  async logout(userId: string): Promise<void> {
    throw new Error('logout() not implemented');
  }

  async verifyToken(token: string): Promise<{ userId: string; email: string }> {
    throw new Error('verifyToken() not implemented');
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; expiresAt: string }> {
    throw new Error('refreshToken() not implemented');
  }
}

export const authService = new AuthService();
