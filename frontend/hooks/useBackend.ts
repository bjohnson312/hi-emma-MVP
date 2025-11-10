import { useClerk } from "../lib/clerk";
import backend from "~backend/client";

export function useBackend() {
  const { getToken, isSignedIn } = useClerk();
  
  if (!isSignedIn) return backend;
  
  return backend.with({
    auth: async () => {
      const token = await getToken();
      if (!token) return {};
      return { authorization: `Bearer ${token}` };
    },
  });
}
