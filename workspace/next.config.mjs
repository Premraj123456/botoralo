/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID,
        NEXT_PUBLIC_STRIPE_POWER_PLAN_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_POWER_PLAN_PRICE_ID,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
};

export default nextConfig;
