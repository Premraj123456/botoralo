
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBotById } from '@/lib/supabase/actions';

const BACKEND_URL = process.env.BOT_BACKEND_URL;
const MASTER_KEY = process.env.BOT_BACKEND_MASTER_KEY;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!BACKEND_URL || !MASTER_KEY) {
    return new Response(
      "data: [error] Backend not configured. Cannot stream logs.\\n\\n",
      { status: 500, headers: { 'Content-Type': 'text/event-stream' } }
    );
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

  const body = JSON.stringify({
    userId: user.id,
    botoraloBotId: botId,
  });

  // Fetch the logs from the backend. The response from the backend is already a stream.
  const backendResponse = await fetch(`${BACKEND_URL}/logs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MASTER_KEY}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!backendResponse.ok || !backendResponse.body) {
    const errorText = await backendResponse.text();
    console.error("Failed to stream logs from backend:", errorText);
    return new Response(
      `data: [error] Failed to connect to log stream: ${errorText}\\n\\n`,
      { status: backendResponse.status, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  // Stream the response directly from the backend to the client.
  return new Response(backendResponse.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
