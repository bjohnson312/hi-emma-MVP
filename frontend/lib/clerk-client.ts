import { CLERK_PUBLISHABLE_KEY } from "../config";
import backend from "~backend/client";

interface ClerkUser {
  id: string;
  email_addresses: Array<{ email_address: string }>;
  first_name?: string;
  last_name?: string;
}

interface ClerkSession {
  id: string;
  user_id: string;
  status: string;
  last_active_token?: {
    jwt: string;
  };
}

class ClerkClient {
  private publishableKey: string;
  private sessionToken: string | null = null;
  private user: ClerkUser | null = null;

  constructor(publishableKey: string) {
    this.publishableKey = publishableKey;
    this.loadSession();
  }

  private loadSession() {
    if (typeof window !== 'undefined') {
      this.sessionToken = localStorage.getItem('clerk_session_token');
    }
  }

  private saveSession(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clerk_session_token', token);
      this.sessionToken = token;
    }
  }

  private clearSession() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('clerk_session_token');
      this.sessionToken = null;
      this.user = null;
    }
  }

  async signUp(emailAddress: string, password: string): Promise<ClerkUser> {
    const data = await backend.auth.signup({ email: emailAddress, password });
    
    this.saveSession(data.userId);
    localStorage.setItem('emma_user_email', data.email);

    return {
      id: data.userId,
      email_addresses: [{ email_address: data.email }],
    };
  }

  async signIn(emailAddress: string, password: string): Promise<ClerkUser> {
    const data = await backend.auth.login({ email: emailAddress, password });
    
    this.saveSession(data.userId);
    localStorage.setItem('emma_user_email', data.email);

    return {
      id: data.userId,
      email_addresses: [{ email_address: data.email }],
    };
  }



  async getCurrentUser(): Promise<ClerkUser | null> {
    if (!this.sessionToken) {
      return null;
    }

    const storedEmail = localStorage.getItem('emma_user_email');
    
    if (storedEmail) {
      this.user = {
        id: this.sessionToken,
        email_addresses: [{ email_address: storedEmail }],
      };
      return this.user;
    }

    return null;
  }

  getToken(): string | null {
    return this.sessionToken;
  }

  signOut() {
    this.clearSession();
  }

  isSignedIn(): boolean {
    return this.sessionToken !== null;
  }

  signInWithOAuth(provider: 'oauth_google' | 'oauth_apple' | 'oauth_facebook') {
    const redirectUrl = `${window.location.origin}/oauth-callback`;
    
    const frontendApiBase64 = this.publishableKey
      .replace('pk_test_', '')
      .replace('pk_live_', '')
      .replace('$', '');
    
    const frontendApi = atob(frontendApiBase64).replace('$', '');
    
    const providerName = provider.replace('oauth_', '');
    const oauthUrl = `https://${frontendApi}/v1/oauth/${providerName}/authorize?redirect_url=${encodeURIComponent(redirectUrl)}`;
    
    window.location.href = oauthUrl;
  }

  async handleOAuthCallback(token: string): Promise<ClerkUser> {
    this.saveSession(token);
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('Failed to get user after OAuth');
    }
    return user;
  }
}

export const clerkClient = new ClerkClient(CLERK_PUBLISHABLE_KEY);
