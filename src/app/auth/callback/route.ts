
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { upsertUserProfile } from '@/lib/supabase/actions';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // This is the key step. A profile is created as soon as the user is authenticated.
      // This ensures the profile exists before any Paddle webhook arrives.
      await upsertUserProfile({ userId: data.user.id, email: data.user.email! });
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // return the user to an error page with instructions
  console.error('Authentication error: Invalid code or other issue during session exchange.');
  return NextResponse.redirect(`${origin}/signin?error=auth-code-error`);
}
