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
    // Mock Clerk signup - just store user locally
    // In production, this would call Clerk's API
    const userId = `user_${Date.now()}`;
    this.saveUser(userId, emailAddress);

    return {
      id: userId,
      email_addresses: [{ email_address: emailAddress }],
    };
  }

  async signIn(emailAddress: string, password: string): Promise<ClerkUser> {
    // Mock Clerk signin - just load from localStorage
    // In production, this would validate with Clerk's API
    const storedUserId = localStorage.getItem('emma_user_id');
    const storedEmail = localStorage.getItem('emma_user_email');
    
    if (storedEmail === emailAddress && storedUserId) {
      this.user = {
        id: storedUserId,
        email_addresses: [{ email_address: storedEmail }],
      };
      return this.user;
    }
    
    throw new Error('Invalid email or password');
  }

  async getCurrentUser(): Promise<ClerkUser | null> {
    return this.user;
  }

  signOut() {
    this.clearUser();
  }

  isSignedIn(): boolean {
    return this.user !== null;
  }
}

export const clerkClient = new ClerkClient(CLERK_PUBLISHABLE_KEY);
