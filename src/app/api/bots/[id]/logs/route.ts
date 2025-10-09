
import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBotById } from '@/lib/supabase/actions';

const BACKEND_URL = process.env.BOT_BACKEND_URL;
const MASTER_KEY = process.env.BOT_BACKEND_MASTER_KEY;

export const runtime = 'nodejs'; // Crucial for preventing response buffering

// IMPORTANT: This route now accepts POST requests to match the Python backend
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!BACKEND_URL || !MASTER_KEY) {
    const stream = new ReadableStream({
      start(controller) {
        const message = "data: [error] Backend service is not configured on the server. Cannot stream logs.\n\n";
        controller.enqueue(new TextEncoder().encode(message));
        controller.close();
      },
    });
    return new Response(stream, { status: 500, headers: { 'Content-Type': 'text/event-stream' } });
  }

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const botId = params.id;
  try {
    const bot = await getBotById(botId);
    if (!bot || bot.owner_id !== user.id) {
      return new Response('Bot not found or you do not have permission to view it.', { status: 404 });
    }
  } catch (e) {
    return new Response('Error fetching bot data.', { status: 500 });
  }

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MASTER_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        userId: user.id,
        botoraloBotId: botId,
      }),
      // @ts-ignore - This is required for streaming in some Node.js environments.
      duplex: 'half', 
    });

    if (!backendResponse.ok || !backendResponse.body) {
      const errorText = await backendResponse.text();
      console.error(`Backend log stream failed: ${errorText}`);
      throw new Error(`Failed to connect to the backend log stream: ${errorText}`);
    }

    const stream = new TransformStream({
        transform(chunk, controller) {
            controller.enqueue(chunk);
        }
    });

    backendResponse.body.pipeTo(stream.writable);
    
    return new Response(stream.readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
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
