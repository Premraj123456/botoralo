
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createSupabaseClient } from './client';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function getCurrentUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user };
}

export async function signOut() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function signInWithOtp(email: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: {
        flow_type: 'signup', // This forces the OTP email template instead of the magic link one.
      }
    },
  });

  if (error) {
    console.error('Error sending OTP:', error);
    return { error: 'Could not send OTP. Please try again.' };
  }

  return { data };
}

export async function verifyOtp(email: string, token: string, type: EmailOtpType = 'signup') {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type,
    });

    if (error) {
        console.error('Error verifying OTP:', error);
        return { error: 'Invalid or expired OTP. Please try again.' };
    }
    
    // A successful verification should create a session.
    // The middleware will handle redirection on the next request.
    return { data };
}
