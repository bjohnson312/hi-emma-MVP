import { Client } from '~backend/client';
import { clerkClient } from './clerk-client';

// Create a simple JWT-like token for the backend
// In a real Clerk app, this would come from @clerk/clerk-react's getToken()
async function getClerkToken() {
  console.log('[Backend Client] 🔍 Getting Clerk token...');
  
  if (!clerkClient.isSignedIn()) {
    console.log('[Backend Client] ❌ User not signed in');
    return undefined;
  }

  const user = await clerkClient.getCurrentUser();
  if (!user) {
    console.log('[Backend Client] ❌ No user found');
    return undefined;
  }

  console.log('[Backend Client] ✅ User signed in:', { userId: user.id, email: user.email_addresses[0]?.email_address });

  // Create a base64-encoded JWT-like token
  // Format: header.payload.signature (simplified - not cryptographically secure)
  const header = { alg: "none", typ: "JWT" };
  const payload = { sub: user.id, email: user.email_addresses[0]?.email_address };
  
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = "mock-signature"; // In production, this would be a real signature
  
  const token = `${headerB64}.${payloadB64}.${signature}`;
  
  console.log('[Backend Client] 🎫 Generated token:', {
    header: header,
    payload: payload,
    tokenPreview: `${token.substring(0, 50)}...`
  });
  
  return token;
}

export default new Client(import.meta.env.VITE_CLIENT_TARGET, {
  auth: async () => {
    console.log('[Backend Client] 🔐 Auth function called');
    const token = await getClerkToken();
    
    if (token) {
      console.log('[Backend Client] ✅ Returning authorization header with token');
      return { authorization: `Bearer ${token}` };
    } else {
      console.log('[Backend Client] ⚠️  No token available, returning undefined');
      return undefined;
    }
  },
  requestInit: { credentials: "include" }
});
