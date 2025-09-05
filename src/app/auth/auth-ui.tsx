'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client';

export default function AuthUI() {
    const supabase = createClient();

    return (
        <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
            <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                theme="dark"
                providers={['google', 'github']}
                redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`}
            />
        </div>
    );
}
