import { useState } from "react";
import AdminLoginPage from "./components/AdminLoginPage";
import AdminDashboard from "./components/AdminDashboard";

interface AdminPortalAppProps {
  onBackToSignIn?: () => void;
}

export default function AdminPortalApp({ onBackToSignIn }: AdminPortalAppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const handleLoginSuccess = (token: string) => {
    setAdminToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setAdminToken(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminLoginPage onLoginSuccess={handleLoginSuccess} onBackToSignIn={onBackToSignIn} />;
  }

  return <AdminDashboard adminToken={adminToken!} onLogout={handleLogout} />;
}
