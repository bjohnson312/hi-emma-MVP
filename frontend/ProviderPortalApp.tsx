import { useState, useEffect } from "react";
import { ProviderLoginPage } from "./components/ProviderLoginPage";
import { ProviderDashboard } from "./components/ProviderDashboard";
import { Toaster } from "./components/ui/toaster";

export default function ProviderPortalApp() {
  const [token, setToken] = useState<string | null>(null);
  const [providerData, setProviderData] = useState<any>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("provider_token");
    const savedData = localStorage.getItem("provider_data");
    if (savedToken && savedData) {
      setToken(savedToken);
      setProviderData(JSON.parse(savedData));
    }
  }, []);

  const handleLogin = (newToken: string, data: any) => {
    setToken(newToken);
    setProviderData(data);
    localStorage.setItem("provider_token", newToken);
    localStorage.setItem("provider_data", JSON.stringify(data));
  };

  const handleLogout = () => {
    setToken(null);
    setProviderData(null);
    localStorage.removeItem("provider_token");
    localStorage.removeItem("provider_data");
  };

  return (
    <div className="dark">
      {!token ? (
        <ProviderLoginPage onLogin={handleLogin} />
      ) : (
        <ProviderDashboard
          token={token}
          providerData={providerData}
          onLogout={handleLogout}
        />
      )}
      <Toaster />
    </div>
  );
}
