// Supabase module barrel export

// Browser client (for use in client components)
export { createClient as createBrowserClient } from './client';

// Server client and auth utilities (for use in server actions/components)
export {
  createClient,
  requireAuth,
  getOptionalAuth,
  tryAuth,
  withAuth,
  success,
  failure,
  type ActionResult,
  type AuthContext,
} from './server';
