import { Client } from '~backend/client';
import { clerkClient } from './clerk-client';

async function getClerkAuthData() {
  try {
    if (clerkClient.isSignedIn()) {
      const token = await clerkClient.getToken();
      
      console.log('[Backend Client] Clerk auth token retrieved:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (token) {
        return {
          authorization: `Bearer ${token}`
        };
      }
    } else {
      console.log('[Backend Client] User not signed in via Clerk');
    }
  } catch (error) {
    console.error('[Backend Client] Failed to get Clerk auth token:', error);
  }
  
  return undefined;
}

const backend = new Client(
  import.meta.env.VITE_CLIENT_TARGET,
  {
    requestInit: {
      credentials: 'include'
    },
    auth: getClerkAuthData
  }
);

export default backend;
