import { Client } from '~backend/client';
import { clerkClient } from './clerk-client';

async function getAuthToken() {
  if (!clerkClient.isSignedIn()) {
    return undefined;
  }

  const token = await clerkClient.getToken();
  return token;
}

export default new Client(import.meta.env.VITE_CLIENT_TARGET, {
  auth: async () => {
    const token = await getAuthToken();
    
    if (token) {
      return { authorization: `Bearer ${token}` };
    } else {
      return undefined;
    }
  }
});
