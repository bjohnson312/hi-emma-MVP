import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react";
import backend from "~backend/client";

const MOTIVATIONAL_QUOTES = [
  "Every day is a fresh start.",
  "Small steps lead to big changes.",
  "Your wellness journey begins with a single choice.",
  "Progress, not perfection.",
  "You are stronger than you think.",
  "Health is wealth, invest in yourself.",
  "One day at a time, one breath at a time.",
  "Your body hears everything your mind says.",
  "Take care of your body, it's the only place you have to live.",
  "Self-care is not selfish.",
  "You deserve to feel good.",
  "Believe in yourself and all that you are.",
  "The journey of a thousand miles begins with one step.",
  "Your health is an investment, not an expense.",
  "Be kind to yourself.",
  "Every accomplishment starts with the decision to try.",
  "You are capable of amazing things.",
  "Wellness is a journey, not a destination.",
  "Make yourself a priority.",
  "Your mind is a powerful thing.",
  "Start where you are, use what you have.",
  "You are worth the effort.",
  "Small changes can make a big difference.",
  "Listen to your body, it knows what it needs.",
  "Healing takes time, be patient with yourself.",
  "You are doing better than you think.",
  "Every day may not be good, but there's good in every day.",
  "Your wellness matters.",
  "Take time to do what makes your soul happy.",
  "You are enough, just as you are.",
  "Embrace the journey, trust the process.",
  "Your health is your greatest asset.",
  "Breathe deeply and let go.",
  "You have the power to create change.",
  "Rest is productive too.",
  "Your story isn't over yet.",
  "Choose progress over perfection.",
  "Be gentle with yourself, you're doing the best you can.",
  "Every moment is a chance to begin again.",
  "You are worthy of good health and happiness."
];

interface LoginPageProps {
  onLoginSuccess: (userId: string, email: string) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
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
      if (isSignup) {
        const response = await backend.auth.signup({ email, password });
        toast({
          title: "Account created!",
          description: "Welcome to Hi, Emma. Check your email for a welcome message.",
        });
        onLoginSuccess(response.userId, response.email);
      } else {
        const response = await backend.auth.login({ email, password });
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        onLoginSuccess(response.userId, response.email);
      }
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
          <p className="text-sm italic text-gray-800 font-medium">
            "{randomQuote}"
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8 border border-white/20">
          <div className="flex gap-2 mb-6">
            <Button
              variant={!isSignup ? "default" : "outline"}
              className="flex-1"
              onClick={() => setIsSignup(false)}
              type="button"
            >
              Sign In
            </Button>
            <Button
              variant={isSignup ? "default" : "outline"}
              className="flex-1"
              onClick={() => setIsSignup(true)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {isSignup && (
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 8 characters
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
