
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBotById } from '@/lib/supabase/actions';

const BACKEND_URL = process.env.BOT_BACKEND_URL;
const MASTER_KEY = process.env.BOT_BACKEND_MASTER_KEY;

// This is crucial to prevent Next.js from buffering the response in serverless environments.
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
      throw new Error(`Failed to connect to log stream: ${errorText}`);
    }

    const reader = backendResponse.body.getReader();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode('data: [info] Log stream connected...\n\n'));
        
        req.signal.addEventListener("abort", () => {
          reader.cancel();
          controller.close();
        });

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            // The value from the backend is already formatted as "data: ...\n\n"
            // We just forward it directly.
            controller.enqueue(value);
          }
        } catch (error) {
          console.error('Error while reading from backend stream:', error);
          try {
            controller.enqueue(encoder.encode(`data: [error] An error occurred while reading logs: ${(error as Error).message}\n\n`));
          } catch(e) {}
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
        'X-Accel-Buffering': 'no', // For NGINX proxies
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
