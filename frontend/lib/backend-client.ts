import { Client } from '~backend/client';
import { clerkClient } from './clerk-client';

// Create a simple JWT-like token for the backend
// In a real Clerk app, this would come from @clerk/clerk-react's getToken()
async function getClerkToken() {
  if (!clerkClient.isSignedIn()) {
    return undefined;
  }

  const user = await clerkClient.getCurrentUser();
  if (!user) {
    return undefined;
  }

  // Create a base64-encoded JWT-like token
  // Format: header.payload.signature (simplified - not cryptographically secure)
  const header = { alg: "none", typ: "JWT" };
  const payload = { sub: user.id, email: user.email_addresses[0]?.email_address };
  
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = "mock-signature"; // In production, this would be a real signature
  
  return `${headerB64}.${payloadB64}.${signature}`;
}

export default new Client(import.meta.env.VITE_CLIENT_TARGET, {
  auth: async () => {
    const token = await getClerkToken();
    return token ? { authorization: `Bearer ${token}` } : undefined;
  },
  requestInit: { credentials: "include" }
});
