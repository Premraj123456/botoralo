
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This route signs in a dedicated demo user to create a valid session.
// IMPORTANT: You must create a user in your Supabase project with these exact credentials:
// Email:    demo@user.com
// Password: password
export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: 'demo@user.com',
    password: 'password', 
  });

  if (error) {
    console.error('Demo Login Error:', error.message);
    // If login fails (e.g., user doesn't exist), redirect back to signin with an error.
    // This provides feedback instead of getting stuck in a loop.
    return NextResponse.redirect(`${origin}/signin?error=demo_login_failed`);
  }

  // After a successful sign-in, a session cookie is set.
  // Redirecting to the dashboard will now pass the middleware check.
  return NextResponse.redirect(`${origin}/dashboard`);
}
