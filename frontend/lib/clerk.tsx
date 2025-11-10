import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { CLERK_PUBLISHABLE_KEY } from "../config";

interface ClerkUser {
  id: string;
  email: string | null;
  imageUrl: string;
}

interface ClerkContextType {
  user: ClerkUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const ClerkContext = createContext<ClerkContextType | null>(null);

declare global {
  interface Window {
    Clerk?: any;
  }
}

export function ClerkProvider({ children }: { children: ReactNode }) {
  const [clerk, setClerk] = useState<any>(null);
  const [user, setUser] = useState<ClerkUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.clerk.com/npm/@clerk/clerk-js@latest/dist/clerk.browser.js";
    script.async = true;
    script.onload = () => {
      if (window.Clerk) {
        window.Clerk.load({
          publishableKey: CLERK_PUBLISHABLE_KEY,
        }).then((clerkInstance: any) => {
          setClerk(clerkInstance);
          setIsLoaded(true);
          
          if (clerkInstance.user) {
            setUser({
              id: clerkInstance.user.id,
              email: clerkInstance.user.primaryEmailAddress?.emailAddress ?? null,
              imageUrl: clerkInstance.user.imageUrl,
            });
          }

          clerkInstance.addListener((event: any) => {
            if (event.user) {
              setUser({
                id: event.user.id,
                email: event.user.primaryEmailAddress?.emailAddress ?? null,
                imageUrl: event.user.imageUrl,
              });
            } else {
              setUser(null);
            }
          });
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const getToken = async () => {
    if (!clerk?.session) return null;
    return await clerk.session.getToken();
  };

  const signOut = async () => {
    if (clerk) {
      await clerk.signOut();
      setUser(null);
    }
  };

  const value: ClerkContextType = {
    user,
    isLoaded,
    isSignedIn: !!user,
    getToken,
    signOut,
  };

  return <ClerkContext.Provider value={value}>{children}</ClerkContext.Provider>;
}

export function useClerk() {
  const context = useContext(ClerkContext);
  if (!context) {
    throw new Error("useClerk must be used within ClerkProvider");
  }
  return context;
}

export function SignIn() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (window.Clerk) {
      window.Clerk.openSignIn();
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full max-w-md">
      <div id="clerk-sign-in" className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Sign in to Hi, Emma</h2>
        <div id="clerk-mount-point"></div>
      </div>
    </div>
  );
}

export function SignedIn({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useClerk();
  if (!isLoaded) return null;
  return isSignedIn ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useClerk();
  if (!isLoaded) return null;
  return !isSignedIn ? <>{children}</> : null;
}
