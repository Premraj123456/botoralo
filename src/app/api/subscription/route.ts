
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getUserSubscription } from '@/lib/supabase/actions';

const MASTER_KEY = process.env.BOT_BACKEND_MASTER_KEY;

export async function GET(req: NextRequest) {
  // 1. Authenticate the request
  const authHeader = req.headers.get('Authorization');
  if (!MASTER_KEY || !authHeader || authHeader !== `Bearer ${MASTER_KEY}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Get userId from query parameters
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
  }

  // 3. Fetch subscription details
  try {
    // Use the existing server action to get subscription from Paddle
    // @ts-ignore
    const subscription = await getUserSubscription(userId);

    return NextResponse.json(subscription);

  } catch (error) {
    console.error(`[API /subscription] - Error fetching subscription for user ${userId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch subscription', details: (error as Error).message }, { status: 500 });
  }
}
