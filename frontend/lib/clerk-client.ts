import { CLERK_PUBLISHABLE_KEY } from "../config";

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
    const response = await fetch(`https://api.clerk.com/v1/client/sign_ups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.publishableKey}`,
      },
      body: JSON.stringify({
        email_address: emailAddress,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.message || 'Sign up failed');
    }

    const data = await response.json();
    
    if (data.status === 'complete' && data.created_session_id) {
      await this.activateSession(data.created_session_id);
    }

    return data.user;
  }

  async signIn(emailAddress: string, password: string): Promise<ClerkUser> {
    const response = await fetch(`https://api.clerk.com/v1/client/sign_ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.publishableKey}`,
      },
      body: JSON.stringify({
        identifier: emailAddress,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.message || 'Sign in failed');
    }

    const data = await response.json();
    
    if (data.status === 'complete' && data.created_session_id) {
      await this.activateSession(data.created_session_id);
    }

    return data.user;
  }

  private async activateSession(sessionId: string) {
    const response = await fetch(`https://api.clerk.com/v1/client/sessions/${sessionId}/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.publishableKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to activate session');
    }

    const data = await response.json();
    if (data.jwt) {
      this.saveSession(data.jwt);
    }
  }

  async getCurrentUser(): Promise<ClerkUser | null> {
    if (!this.sessionToken) {
      return null;
    }

    try {
      const response = await fetch(`https://api.clerk.com/v1/client/sessions/${this.sessionToken}/user`, {
        headers: {
          'Authorization': `Bearer ${this.publishableKey}`,
        },
      });

      if (!response.ok) {
        this.clearSession();
        return null;
      }

      this.user = await response.json();
      return this.user;
    } catch (error) {
      this.clearSession();
      return null;
    }
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
    const clerkFrontendApi = this.publishableKey.replace('pk_test_', '').replace('pk_live_', '');
    const baseUrl = `https://${clerkFrontendApi}`;
    
    const oauthUrl = `${baseUrl}/v1/oauth/${provider}/authorize?redirect_url=${encodeURIComponent(redirectUrl)}`;
    
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
