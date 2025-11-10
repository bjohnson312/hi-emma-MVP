import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clerkClient } from "@/lib/clerk-client";

export function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('__clerk_db_jwt') || params.get('token');

      if (token) {
        try {
          await clerkClient.handleOAuthCallback(token);
          navigate('/');
        } catch (error) {
          console.error('OAuth callback error:', error);
          navigate('/?error=oauth_failed');
        }
      } else {
        navigate('/?error=no_token');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6656cb] mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
