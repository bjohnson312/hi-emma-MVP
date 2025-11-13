import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Shield, ArrowLeft } from "lucide-react";
import backend from "~backend/client";

const PROVIDER_QUOTES = [
  "Excellence in patient care starts here.",
  "Supporting health professionals in delivering better care.",
  "Empowering providers with comprehensive patient insights.",
  "Your dedication to patient wellness matters.",
  "Together, we improve patient outcomes.",
];

interface ProviderLoginPageProps {
  onLogin: (token: string, data: any) => void;
  onBackToSignIn?: () => void;
}

export function ProviderLoginPage({ onLogin, onBackToSignIn }: ProviderLoginPageProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [license, setLicense] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();
  
  const randomQuote = useMemo(() => {
    return PROVIDER_QUOTES[Math.floor(Math.random() * PROVIDER_QUOTES.length)];
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (isSignup) {
        const result = await backend.provider_auth.signup({
          email,
          password,
          fullName,
          specialty,
          licenseNumber: license,
        });
        
        toast({
          title: "Welcome to the Provider Portal! 🎉",
          description: "Your account has been created successfully.",
        });
        
        onLogin(result.token, {
          providerId: result.providerId,
          email,
          fullName,
        });
      } else {
        const result = await backend.provider_auth.login({
          email,
          password,
        });
        
        toast({
          title: "Welcome back! 👋",
          description: "You've successfully logged in.",
        });
        
        onLogin(result.token, {
          providerId: result.providerId,
          email: result.email,
          fullName: result.fullName,
        });
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      let message = "Something went wrong. Please try again.";
      
      if (error.message) {
        const msg = error.message.toLowerCase();
        
        if (msg.includes("already exists") || msg.includes("duplicate")) {
          message = "This email is already registered. Please sign in instead.";
          setTimeout(() => {
            setIsSignup(false);
            setErrorMessage("");
          }, 3000);
        } else if (msg.includes("invalid") || msg.includes("not found")) {
          message = "Invalid credentials. Please check your email and password.";
        } else {
          message = error.message;
        }
      }
      
      setErrorMessage(message);
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
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-8 h-8 text-[#6656cb]" />
            <h1 className="text-4xl font-bold text-[#6656cb]">Provider Portal</h1>
          </div>
          <p className="text-[#4e8f71]">Healthcare professional access</p>
        </div>

        <div className="mb-6 text-center py-4 px-6 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 shadow-lg">
          <p className="text-sm italic text-gray-800 font-medium">"{randomQuote}"</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8 border border-white/20">
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
            {errorMessage && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}
            
            {isSignup && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium mb-2 text-foreground">
                    Full Name
                  </label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Dr. Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="specialty" className="block text-sm font-medium mb-2 text-foreground">
                    Specialty
                  </label>
                  <Input
                    id="specialty"
                    type="text"
                    placeholder="Cardiology"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="license" className="block text-sm font-medium mb-2 text-foreground">
                    License Number
                  </label>
                  <Input
                    id="license"
                    type="text"
                    placeholder="MD123456"
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@hospital.com"
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
              {loading ? "Loading..." : isSignup ? "Create Provider Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-gray-600">
            <p>Secure HIPAA-compliant authentication</p>
          </div>

          {onBackToSignIn && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onBackToSignIn}
                className="text-xs text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Patient Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
