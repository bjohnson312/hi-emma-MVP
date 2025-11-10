import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { clerkClient } from "@/lib/clerk-client";

const MOTIVATIONAL_QUOTES = [
  "Every day is a fresh start.",
  "Small steps lead to big changes.",
  "Your wellness journey begins with a single choice.",
  "Progress, not perfection.",
  "You are stronger than you think.",
  "Health is wealth, invest in yourself.",
  "One day at a time, one breath at a time.",
  "You deserve to feel good.",
  "Believe in yourself and all that you are.",
  "You are capable of amazing things.",
];

interface ClerkLoginPageProps {
  onLoginSuccess: (userId: string, email: string) => void;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853"/>
    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.694 15.343c-.488.713-1.023 1.403-1.844 1.416-.74.012-1.003-.438-1.872-.438-.868 0-1.166.426-1.895.45-.756.025-1.418-.757-1.91-1.467-1.005-1.45-1.774-4.097-.741-5.885.513-.888 1.431-1.45 2.426-1.463.758-.012 1.473.51 1.937.51.463 0 1.333-.63 2.248-.537.383.016 1.458.155 2.148 1.166-.056.035-1.283.75-1.27 2.237.014 1.773 1.555 2.362 1.569 2.368-.017.038-.245.84-.808 1.665m-2.478-7.343c.408-.495.684-1.182.608-1.868-.588.024-1.3.391-1.72.884-.377.435-.707 1.13-.618 1.797.654.051 1.322-.333 1.73-.813"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 9C18 4.02944 13.9706 0 9 0C4.02944 0 0 4.02944 0 9C0 13.4922 3.29116 17.2155 7.59375 17.8907V11.6016H5.30859V9H7.59375V7.01719C7.59375 4.76156 8.93742 3.51562 10.9932 3.51562C11.9776 3.51562 13.0078 3.69141 13.0078 3.69141V5.90625H11.8729C10.7549 5.90625 10.4062 6.60001 10.4062 7.3125V9H12.9023L12.5033 11.6016H10.4062V17.8907C14.7088 17.2155 18 13.4922 18 9Z" fill="#1877F2"/>
  </svg>
);

export function ClerkLoginPage({ onLoginSuccess }: ClerkLoginPageProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  
  const randomQuote = useMemo(() => {
    return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let user;
      if (isSignup) {
        user = await clerkClient.signUp(email, password);
        toast({
          title: "Account created!",
          description: "Welcome to Hi, Emma.",
        });
      } else {
        user = await clerkClient.signIn(email, password);
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
      }
      
      onLoginSuccess(user.id, user.email_addresses[0]?.email_address || email);
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Error",
        description: error.message || "Authentication failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: 'oauth_google' | 'oauth_apple' | 'oauth_facebook') => {
    try {
      clerkClient.signInWithOAuth(provider);
    } catch (error: any) {
      console.error("OAuth error:", error);
      toast({
        title: "Error",
        description: "Failed to initiate OAuth login. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-[#e8f5e9]/50 to-[#d6f0c2]/50 backdrop-blur-[1px]"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#6656cb] mb-2">Hi, Emma</h1>
          <p className="text-[#4e8f71]">Your personal wellness companion</p>
        </div>

        <div className="mb-6 text-center py-4 px-6 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 shadow-lg">
          <p className="text-sm italic text-gray-800 font-medium">"{randomQuote}"</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8 border border-white/20">
          <div className="space-y-3 mb-6">
            <Button
              onClick={() => handleOAuthLogin('oauth_google')}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-11"
              type="button"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </Button>
            
            <Button
              onClick={() => handleOAuthLogin('oauth_apple')}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-11"
              type="button"
            >
              <AppleIcon />
              <span>Continue with Apple</span>
            </Button>
            
            <Button
              onClick={() => handleOAuthLogin('oauth_facebook')}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-11"
              type="button"
            >
              <FacebookIcon />
              <span>Continue with Facebook</span>
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/90 text-gray-500">Or continue with email</span>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <Button
              onClick={() => setIsSignup(false)}
              variant={!isSignup ? "default" : "outline"}
              className="flex-1"
              type="button"
            >
              Sign In
            </Button>
            <Button
              onClick={() => setIsSignup(true)}
              variant={isSignup ? "default" : "outline"}
              className="flex-1"
              type="button"
            >
              Sign Up
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-foreground">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isSignup && (
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Loading..." : isSignup ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-gray-600">
            <p>Powered by Clerk Authentication</p>
          </div>
        </div>
      </div>
    </div>
  );
}
