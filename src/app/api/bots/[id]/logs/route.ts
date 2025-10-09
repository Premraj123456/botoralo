import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBotById } from '@/lib/supabase/actions';

const BACKEND_URL = process.env.BOT_BACKEND_URL;
const MASTER_KEY = process.env.BOT_BACKEND_MASTER_KEY;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!BACKEND_URL || !MASTER_KEY) {
    const stream = new ReadableStream({
      start(controller) {
        const message = "data: [error] Backend not configured. Cannot stream logs.\\n\\n";
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
      },
      body,
      // Important: `duplex: 'half'` is required for streaming request bodies
      // @ts-ignore
      duplex: 'half',
    });

    if (!backendResponse.ok || !backendResponse.body) {
      const errorText = await backendResponse.text();
      console.error("Failed to stream logs from backend:", errorText);
      const stream = new ReadableStream({
        start(controller) {
          const message = `data: [error] Failed to connect to log stream: ${errorText.replace(/\\n/g, ' ')}\\n\\n`;
          controller.enqueue(new TextEncoder().encode(message));
          controller.close();
        },
      });
      return new Response(stream, { status: backendResponse.status, headers: { 'Content-Type': 'text/event-stream' } });
    }

    // Create a new stream to forward and format events correctly.
    const reader = backendResponse.body.getReader();
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        function push() {
          reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            // The chunk from the backend is already in the "data: ...\n\n" format.
            // We just need to forward it.
            controller.enqueue(value);
            push();
          }).catch(error => {
            console.error('Error reading from backend stream:', error);
            controller.error(error);
          });
        }
        push();
      }
    });
    
    return new Response(customStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Fetch failed for log stream:', error);
    const stream = new ReadableStream({
        start(controller) {
          const message = `data: [error] Failed to establish connection to the backend service.\\n\\n`;
          controller.enqueue(new TextEncoder().encode(message));
          controller.close();
        },
      });
    return new Response(stream, { status: 500, headers: { 'Content-Type': 'text/event-stream' } });
  }
}
