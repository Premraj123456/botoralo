'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client';

export default function AuthUI() {
    const supabase = createClient();

    return (
        <div className="w-full max-w-md">
            <Auth
                supabaseClient={supabase}
                appearance={{ 
                    theme: ThemeSupa,
                    variables: {
                        default: {
                            colors: {
                                brand: 'hsl(var(--primary))',
                                brandAccent: 'hsl(var(--primary) / 0.8)',
                            }
                        }
                    },
                    style: {
                      container: {
                        border: 'none',
                        boxShadow: 'none',
                        padding: '0'
                      }
                    }
                 }}
                theme="dark"
                providers={['google', 'github']}
                redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`}
            />
        </div>
    );
}
