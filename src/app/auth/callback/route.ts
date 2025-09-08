
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
      // Create a profile for the new user
      await upsertUserProfile(data.user.id, data.user.email!);
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // return the user to an error page with instructions
  console.error('Authentication error: Invalid code or other issue during session exchange.');
  return NextResponse.redirect(`${origin}/signin?error=auth-code-error`);
}
