import { Client } from '~backend/client';

// The auth system uses session cookies that are automatically sent by the browser.
// No need to manually add authorization headers.
const backend = new Client(
  import.meta.env.VITE_CLIENT_TARGET,
  {
    requestInit: {
      credentials: 'include'  // This ensures cookies are sent with requests
    }
  }
);

export default backend;
