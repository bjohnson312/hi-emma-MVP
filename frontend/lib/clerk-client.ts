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
    const { Client } = await import('~backend/client');
    const backend = new Client(import.meta.env.VITE_CLIENT_TARGET, { requestInit: { credentials: "include" } });
    
    try {
      const data = await backend.auth.signup({ email: emailAddress, password });
      
      this.saveSession(data.userId);
      localStorage.setItem('emma_user_email', data.email);

      return {
        id: data.userId,
        email_addresses: [{ email_address: data.email }],
      };
    } catch (error: any) {
      if (error.message) {
        throw error;
      }
      
      if (error.code === 'already_exists') {
        throw new Error('user with this email already exists');
      }
      
      throw new Error(error.toString());
    }
  }

  async signIn(emailAddress: string, password: string): Promise<ClerkUser> {
    const { Client } = await import('~backend/client');
    const backend = new Client(import.meta.env.VITE_CLIENT_TARGET, { requestInit: { credentials: "include" } });
    
    try {
      const data = await backend.auth.login({ email: emailAddress, password });
      
      this.saveSession(data.userId);
      localStorage.setItem('emma_user_email', data.email);

      return {
        id: data.userId,
        email_addresses: [{ email_address: data.email }],
      };
    } catch (error: any) {
      if (error.message) {
        throw error;
      }
      
      if (error.code === 'unauthenticated') {
        throw new Error('invalid email or password');
      }
      
      throw new Error(error.toString());
    }
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

  getToken(): Promise<string | null> {
    return Promise.resolve(this.sessionToken);
  }

  signOut() {
    this.clearSession();
  }

  isSignedIn(): boolean {
    return this.sessionToken !== null;
  }


}

export const clerkClient = new ClerkClient(CLERK_PUBLISHABLE_KEY);
