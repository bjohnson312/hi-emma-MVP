import backend from "~backend/client";
import { clerkClient } from "@/lib/clerk-client";

export function useBackend() {
  const token = clerkClient.getToken();
  
  if (!token) {
    return backend;
  }
  
  return backend.with({
    auth: {
      authorization: `Bearer ${token}`,
    },
  });
}
