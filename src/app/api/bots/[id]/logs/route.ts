
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBotById } from '@/lib/supabase/actions';

const BACKEND_URL = process.env.BOT_BACKEND_URL;
const MASTER_KEY = process.env.BOT_BACKEND_MASTER_KEY;

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!BACKEND_URL || !MASTER_KEY) {
    const stream = new ReadableStream({
      start(controller) {
        const message = "data: [error] Backend not configured. Cannot stream logs.\n\n";
        controller.enqueue(new TextEncoder().encode(message));
        controller.close();
      },
    });
    return new Response(stream, { status: 500, headers: { 'Content-Type': 'text/event-stream' } });
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

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MASTER_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body,
      // @ts-ignore - duplex is required for streaming request bodies
      duplex: 'half', 
    });

    if (!backendResponse.ok || !backendResponse.body) {
      const errorText = await backendResponse.text();
      console.error(`Log stream connection failed: ${errorText}`);
      throw new Error(`Failed to connect to log stream: ${errorText}`);
    }
    
    // Directly pipe the stream from the backend to the client.
    // The key is to add the correct headers to disable any proxy buffering.
    return new Response(backendResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        // This header is crucial for disabling buffering in proxies like Vercel's
        'X-Accel-Buffering': 'no', 
      },
    });

  } catch (error) {
    const message = `data: [error] Failed to establish connection to the backend service: ${(error as Error).message}\n\n`;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(message));
        controller.close();
      },
    });
    return new Response(stream, { status: 500, headers: { 'Content-Type': 'text/event-stream' } });
  }
}
