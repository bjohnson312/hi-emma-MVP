import { CLERK_PUBLISHABLE_KEY } from "../config";

interface ClerkUser {
  id: string;
  email_addresses: Array<{ email_address: string }>;
  first_name?: string;
  last_name?: string;
}

class ClerkClient {
  private publishableKey: string;
  private user: ClerkUser | null = null;

  constructor(publishableKey: string) {
    this.publishableKey = publishableKey;
    this.loadUser();
  }

  private loadUser() {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('emma_user_id');
      const storedEmail = localStorage.getItem('emma_user_email');
      
      if (storedUserId && storedEmail) {
        this.user = {
          id: storedUserId,
          email_addresses: [{ email_address: storedEmail }],
        };
      }
    }
  }

  private saveUser(userId: string, email: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('emma_user_id', userId);
      localStorage.setItem('emma_user_email', email);
      this.user = {
        id: userId,
        email_addresses: [{ email_address: email }],
      };
    }
  }

  private clearUser() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('emma_user_id');
      localStorage.removeItem('emma_user_email');
      this.user = null;
    }
  }

  async signUp(emailAddress: string, password: string): Promise<ClerkUser> {
    const { Client } = await import('~backend/client');
    const backend = new Client(import.meta.env.VITE_CLIENT_TARGET, { requestInit: { credentials: "include" } });
    
    try {
      const data = await backend.auth.signup({ email: emailAddress, password });
      
      // The backend sets a session cookie automatically
      // We just need to store the user info
      this.saveUser(data.userId, data.email);

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
      
      // The backend sets a session cookie automatically
      // We just need to store the user info
      this.saveUser(data.userId, data.email);

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
    return this.user;
  }

  getToken(): Promise<string | null> {
    // Session is managed via cookies, no token needed
    return Promise.resolve(null);
  }

  signOut() {
    this.clearUser();
    // Note: Should also call backend logout to clear session cookie
  }

  isSignedIn(): boolean {
    return this.user !== null;
  }
}

export const clerkClient = new ClerkClient(CLERK_PUBLISHABLE_KEY);
