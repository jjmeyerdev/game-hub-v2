import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User, SupabaseClient } from '@supabase/supabase-js';

/**
 * Standard result type for server actions
 * Provides consistent error handling across all actions
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Helper to create success result
 */
export function success<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

/**
 * Helper to create error result
 */
export function failure<T>(error: string): ActionResult<T> {
  return { success: false, error };
}

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Auth context returned by requireAuth
 */
export interface AuthContext {
  user: User;
  supabase: SupabaseClient;
}

/**
 * Require authentication for a server action
 * Throws if user is not authenticated, returning the user and supabase client if successful
 */
export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  return { user, supabase };
}

/**
 * Optional authentication - returns null user if not authenticated
 */
export async function getOptionalAuth(): Promise<{ user: User | null; supabase: SupabaseClient }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabase };
}

/**
 * Try to get auth context, returning ActionResult on failure
 * Use this in server actions that need auth but want to return errors instead of throwing
 */
export async function tryAuth(): Promise<
  ActionResult<AuthContext>
> {
  try {
    const context = await requireAuth();
    return success(context);
  } catch {
    return failure('Not authenticated');
  }
}

/**
 * Wrap a server action with authentication
 * Automatically handles auth check and returns error ActionResult if not authenticated
 *
 * @example
 * export const myAction = withAuth(async ({ user, supabase }, arg1, arg2) => {
 *   // user and supabase are guaranteed to exist
 *   return success({ data: 'result' });
 * });
 */
export function withAuth<TArgs extends unknown[], TResult>(
  fn: (ctx: AuthContext, ...args: TArgs) => Promise<ActionResult<TResult>>
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return async (...args: TArgs): Promise<ActionResult<TResult>> => {
    const authResult = await tryAuth();
    if (!authResult.success) {
      return failure(authResult.error);
    }
    return fn(authResult.data, ...args);
  };
}
