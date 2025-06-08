import { NextRequest } from 'next/server'
import { SSEManager } from '@/lib/sse'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', eventId })}\n\n`)
      )

      // Add this connection to the SSE manager
      SSEManager.addConnection(eventId, controller)

      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
        SSEManager.removeConnection(eventId, controller)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
} 