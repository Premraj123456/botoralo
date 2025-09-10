
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBotById } from '@/lib/supabase/actions';

const BACKEND_URL = process.env.BOT_BACKEND_URL;
const MASTER_KEY = process.env.BOT_BACKEND_MASTER_KEY;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!BACKEND_URL || !MASTER_KEY) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 500 });
  }

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const botId = params.id;
  const bot = await getBotById(botId);

  if (!bot || bot.owner_id !== user.id) {
    return new NextResponse('Bot not found or not authorized', { status: 404 });
  }

  try {
    const body = JSON.stringify({
      userId: user.id,
      botoraloBotId: botId,
    });

    const backendResponse = await fetch(`${BACKEND_URL}/stats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MASTER_KEY}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    
    if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        throw new Error(errorData.error || 'Failed to fetch stats from backend');
    }

    const stats = await backendResponse.json();
    return NextResponse.json(stats);

  } catch (error) {
    console.error("Failed to fetch bot stats:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

    