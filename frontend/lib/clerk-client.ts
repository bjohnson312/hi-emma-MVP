interface LocalUser {
  id: string;
  email_addresses: Array<{ email_address: string }>;
  first_name?: string;
  last_name?: string;
}

class LocalAuthClient {
  private user: LocalUser | null = null;
  private token: string | null = null;

  constructor() {
    this.loadUser();
  }

  private loadUser() {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('emma_user_id');
      const storedEmail = localStorage.getItem('emma_user_email');
      const storedToken = localStorage.getItem('emma_auth_token');
      
      if (storedUserId && storedEmail && storedToken) {
        this.user = {
          id: storedUserId,
          email_addresses: [{ email_address: storedEmail }],
        };
        this.token = storedToken;
      }
    }
  }

  private saveUser(userId: string, email: string, token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('emma_user_id', userId);
      localStorage.setItem('emma_user_email', email);
      localStorage.setItem('emma_auth_token', token);
      this.user = {
        id: userId,
        email_addresses: [{ email_address: email }],
      };
      this.token = token;
    }
  }

  private clearUser() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('emma_user_id');
      localStorage.removeItem('emma_user_email');
      localStorage.removeItem('emma_auth_token');
      this.user = null;
      this.token = null;
    }
  }

  async signUp(emailAddress: string, password: string): Promise<LocalUser> {
    const { Client } = await import('~backend/client');
    const backend = new Client(import.meta.env.VITE_CLIENT_TARGET);
    
    try {
      const data = await backend.auth.signup({ email: emailAddress, password });
      this.saveUser(data.userId, data.email, data.token);

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

  async signIn(emailAddress: string, password: string): Promise<LocalUser> {
    const { Client } = await import('~backend/client');
    const backend = new Client(import.meta.env.VITE_CLIENT_TARGET);
    
    try {
      const data = await backend.auth.login({ email: emailAddress, password });
      this.saveUser(data.userId, data.email, data.token);

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

  async getCurrentUser(): Promise<LocalUser | null> {
    return this.user;
  }

  getToken(): Promise<string | null> {
    return Promise.resolve(this.token);
  }

  signOut() {
    this.clearUser();
  }

  isSignedIn(): boolean {
    return this.user !== null && this.token !== null;
  }
}

export const clerkClient = new LocalAuthClient();
