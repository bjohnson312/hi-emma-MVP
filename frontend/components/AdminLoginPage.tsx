import { useState } from "react";
import backend from "@/lib/backend-client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "./ui/use-toast";
import { ArrowLeft } from "lucide-react";

interface AdminLoginPageProps {
  onLoginSuccess: (token: string) => void;
  onBackToSignIn?: () => void;
}

export default function AdminLoginPage({ onLoginSuccess, onBackToSignIn }: AdminLoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await backend.admin_auth.login({ username, password });

      if (response.success && response.token) {
        toast({
          title: "Login successful",
          description: "Welcome to the admin portal",
        });
        onLoginSuccess(response.token);
      } else {
        toast({
          title: "Login failed",
          description: response.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "Failed to login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-purple-200">Sign in to access dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Username
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {onBackToSignIn && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onBackToSignIn}
                className="text-sm text-purple-300 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
