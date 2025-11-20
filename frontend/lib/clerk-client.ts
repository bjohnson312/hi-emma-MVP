import { CLERK_PUBLISHABLE_KEY } from "../config";

interface ClerkUser {
  id: string;
  email_addresses: Array<{ email_address: string }>;
  first_name?: string;
  last_name?: string;
}

interface StoredUser {
  userId: string;
  email: string;
}

class ClerkClient {
  private publishableKey: string;
  private user: ClerkUser | null = null;

  constructor(publishableKey: string) {
    this.publishableKey = publishableKey;
    this.migrateExistingUser();
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

  private migrateExistingUser() {
    if (typeof window !== 'undefined') {
      const existingUserId = localStorage.getItem('emma_user_id');
      const existingEmail = localStorage.getItem('emma_user_email');
      
      if (existingUserId && existingEmail) {
        const usersJson = localStorage.getItem('emma_users');
        const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : [];
        
        const alreadyMigrated = users.some(u => u.userId === existingUserId);
        
        if (!alreadyMigrated) {
          users.push({ userId: existingUserId, email: existingEmail });
          localStorage.setItem('emma_users', JSON.stringify(users));
        }
      }
    }
  }

  async signUp(emailAddress: string, password: string): Promise<ClerkUser> {
    const usersJson = localStorage.getItem('emma_users');
    const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : [];
    
    const existingUser = users.find(u => u.email === emailAddress);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    const userId = `user_${Date.now()}`;
    users.push({ userId, email: emailAddress });
    localStorage.setItem('emma_users', JSON.stringify(users));
    
    this.saveUser(userId, emailAddress);

    return {
      id: userId,
      email_addresses: [{ email_address: emailAddress }],
    };
  }

  async signIn(emailAddress: string, password: string): Promise<ClerkUser> {
    const usersJson = localStorage.getItem('emma_users');
    const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : [];
    
    const user = users.find(u => u.email === emailAddress);
    
    if (user) {
      this.saveUser(user.userId, user.email);
      return {
        id: user.userId,
        email_addresses: [{ email_address: user.email }],
      };
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
