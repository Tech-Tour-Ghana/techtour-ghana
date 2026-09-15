// Compatibility layer for the components ported from the old frontend.
//
// Those components imported getAuthStatus, logoutUser and User from a JWT
// client that talked to the Django API and kept tokens in localStorage. This
// module keeps the same names and return shapes so the ported UI runs
// unchanged, and implements them on Supabase Auth instead. Sessions now live in
// httpOnly cookies, so nothing here reads or writes a token.
//
// New code should use lib/supabase directly rather than growing this file.

import { createBrowserClient } from "@/lib/supabase/client";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  display_name: string;
  created_at?: string;
}

export interface AuthStatusResponse {
  is_authenticated: boolean;
  user?: User;
}

/**
 * The signed in user, or is_authenticated false.
 *
 * Uses getUser rather than getSession. getSession returns whatever the cookie
 * claims without checking it, getUser revalidates with the auth server.
 */
export async function getAuthStatus(): Promise<AuthStatusResponse> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { is_authenticated: false };

  const authUser = data.user;
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, created_at")
    .eq("id", authUser.id)
    .maybeSingle();

  const email = authUser.email ?? "";
  const first = profile?.first_name ?? "";
  const last = profile?.last_name ?? "";
  const full = `${first} ${last}`.trim();

  return {
    is_authenticated: true,
    user: {
      id: authUser.id,
      email,
      first_name: first,
      last_name: last,
      full_name: full,
      display_name: full || email.split("@")[0] || "User",
      created_at: profile?.created_at,
    },
  };
}

/** Signs in with Supabase Auth. Message text matches what the ported login page expects to show inline. */
export async function loginUser(
  email: string,
  password: string,
): Promise<{ success: boolean; message?: string }> {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, message: error.message };
  return { success: true };
}

/**
 * Signs up with Supabase Auth. first_name/last_name land in auth metadata,
 * which public.handle_new_user (0002) reads to seed the profiles row.
 *
 * needsVerification is true when Supabase requires email confirmation before
 * a session exists, which is the normal project setting and is what the
 * ported register page's "check your email" modal is for.
 */
export async function registerUser(params: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; message?: string; needsVerification: boolean }> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: { first_name: params.first_name, last_name: params.last_name },
      emailRedirectTo:
        typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
    },
  });

  if (error) return { success: false, message: error.message, needsVerification: false };
  return { success: true, needsVerification: !data.session };
}

/** Sends a Supabase password reset email. The link lands on /auth/callback, which forwards to /auth/update-password. */
export async function requestPasswordReset(
  email: string,
): Promise<{ success: boolean; message?: string }> {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo:
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=/auth/update-password`
        : undefined,
  });
  if (error) return { success: false, message: error.message };
  return { success: true, message: "Password reset link sent to your email." };
}

export async function logoutUser(): Promise<{ success: boolean }> {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.signOut();

  // The old client cached the user here. Clear it so a stale name is not shown
  // after sign out by components that still read it on first paint.
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
    localStorage.removeItem("just_logged_in");
  }

  return { success: !error };
}
