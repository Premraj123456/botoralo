
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBotById } from '@/lib/supabase/actions';

const BACKEND_URL = process.env.BOT_BACKEND_URL;
const MASTER_KEY = process.env.BOT_BACKEND_MASTER_KEY;

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
      // @ts-ignore
      duplex: 'half',
    });

    if (!backendResponse.ok || !backendResponse.body) {
      const errorText = await backendResponse.text();
      console.error("Failed to stream logs from backend:", errorText);
      const stream = new ReadableStream({
        start(controller) {
          const message = `data: [error] Failed to connect to log stream: ${errorText.replace(/\n/g, ' ')}\n\n`;
          controller.enqueue(new TextEncoder().encode(message));
          controller.close();
        },
      });
      return new Response(stream, { status: backendResponse.status, headers: { 'Content-Type': 'text/event-stream' } });
    }

    // Create a new ReadableStream to proxy the data to the client.
    // This gives us full control over the streaming process.
    const reader = backendResponse.body.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            // value is a Uint8Array, directly enqueue it.
            // The backend is already formatting it as "data: ...\n\n"
            controller.enqueue(value);
          }
        } catch (error) {
          console.error('Error while reading from backend stream:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });
    
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error) {
    console.error('Fetch failed for log stream:', error);
    const stream = new ReadableStream({
        start(controller) {
          const message = `data: [error] Failed to establish connection to the backend service.\n\n`;
          controller.enqueue(new TextEncoder().encode(message));
          controller.close();
        },
      });
    return new Response(stream, { status: 500, headers: { 'Content-Type': 'text/event-stream' } });
  }
}
