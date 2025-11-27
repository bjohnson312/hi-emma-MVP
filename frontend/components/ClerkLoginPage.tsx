import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Shield, Stethoscope } from "lucide-react";
import { clerkClient } from "@/lib/clerk-client";
import { cn } from "@/lib/utils";

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
  onLoginSuccess: (userId: string, email: string, isNewSignup?: boolean) => void;
  onAdminClick?: () => void;
  onProviderClick?: () => void;
}

export function ClerkLoginPage({ onLoginSuccess, onAdminClick, onProviderClick }: ClerkLoginPageProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();
  
  const randomQuote = useMemo(() => {
    return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      let user;
      const isNewSignup = isSignup;
      if (isSignup) {
        user = await clerkClient.signUp(email, password);
        toast({
          title: "Welcome to Hi, Emma! 🎉",
          description: "Your account has been created successfully.",
        });
      } else {
        user = await clerkClient.signIn(email, password);
        toast({
          title: "Welcome back! 👋",
          description: "You've successfully logged in.",
        });
      }
      
      onLoginSuccess(user.id, user.email_addresses[0]?.email_address || email, isNewSignup);
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      let message = "Something went wrong. Please try again.";
      let switchMode = false;
      
      if (error.message) {
        const msg = error.message.toLowerCase();
        
        if (msg.includes("already exists") || msg.includes("duplicate")) {
          message = "This email is already registered. Please sign in instead.";
          switchMode = true;
          
          setTimeout(() => {
            setIsSignup(false);
            setErrorMessage("");
          }, 3000);
        } else if (msg.includes("invalid email")) {
          message = "Please enter a valid email address.";
        } else if (msg.includes("password") && msg.includes("8 characters")) {
          message = "Password must be at least 8 characters long.";
        } else if (msg.includes("invalid") && msg.includes("password")) {
          message = "The email or password you entered is incorrect.";
        } else if (msg.includes("unauthenticated") || msg.includes("not found")) {
          message = "No account found with this email. Please sign up first.";
          switchMode = true;
          
          setTimeout(() => {
            setIsSignup(true);
            setErrorMessage("");
          }, 3000);
        } else if (msg.includes("network") || msg.includes("fetch")) {
          message = "Unable to connect. Please check your internet connection.";
        } else {
          message = error.message;
        }
      }
      
      setErrorMessage(switchMode ? `${message} Switching in 3 seconds...` : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-start justify-center px-4 pt-12 md:pt-16 relative"
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
          <p className="text-[#4e8f71]">Wellness That Listens. Support That Lasts.</p>
        </div>

        <div className="mb-6 text-center py-4 px-6 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 shadow-lg">
          <p className="text-sm italic text-gray-800 font-medium">"{randomQuote}"</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8 border border-white/20">

          <div className="flex gap-2 mb-6">
            <Button
              onClick={() => setIsSignup(false)}
              variant={!isSignup ? "default" : "outline"}
              className={cn(
                "flex-1",
                !isSignup &&
                  "bg-gradient-to-r from-[#6656cb] to-[#4e8f71] text-white shadow hover:opacity-90 border-0"
              )}
              type="button"
            >
              Sign In
            </Button>
            <Button
              onClick={() => setIsSignup(true)}
              variant={isSignup ? "default" : "outline"}
              className={cn(
                "flex-1",
                isSignup &&
                  "bg-gradient-to-r from-[#6656cb] to-[#4e8f71] text-white shadow hover:opacity-90 border-0"
              )}
              type="button"
            >
              Sign Up
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}
            
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
              variant="default"
              className="w-full bg-gradient-to-r from-[#6656cb] to-[#4e8f71] text-white shadow hover:opacity-90 border-0"
            >
              {loading ? "Loading..." : isSignup ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-gray-600">
            <p>Secure authentication powered by Hi, Emma</p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            {onAdminClick && (
              <button
                type="button"
                onClick={onAdminClick}
                className="text-xs text-gray-500 hover:text-purple-600 transition-colors flex items-center gap-1"
              >
                <Shield className="w-3 h-3" />
                Admin Portal
              </button>
            )}
            {onProviderClick && (
              <button
                type="button"
                onClick={onProviderClick}
                className="text-xs text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <Stethoscope className="w-3 h-3" />
                Provider Portal
              </button>
            )}
          </div>
        </div>

        {onProviderClick && (
          <div className="mt-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-3">
              <Stethoscope className="w-6 h-6 text-[#6656cb]" />
              <h3 className="text-lg font-semibold text-gray-900">Healthcare Providers</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Access the Provider Portal for secure patient data management, clinical notes, and HIPAA-compliant messaging.
            </p>
            <Button 
              onClick={onProviderClick}
              className="w-full"
              variant="outline"
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              Sign In to Provider Portal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
