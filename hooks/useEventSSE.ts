import { useEffect, useRef } from 'react'
import type { Event } from '@/lib/redis'

interface SSEData {
  type: 'connected' | 'signup_added' | 'signup_removed'
  eventId?: string
  event?: Event
  signup?: { name: string; timestamp: string }
  removedName?: string
}

interface UseEventSSEProps {
  eventId: string
  onEventUpdate: (event: Event) => void
  onConnectionChange?: (connected: boolean) => void
  enabled?: boolean
}

export function useEventSSE({ eventId, onEventUpdate, onConnectionChange, enabled = true }: UseEventSSEProps) {
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!enabled || !eventId) return

    // Create SSE connection
    const eventSource = new EventSource(`/api/events/${eventId}/stream`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('SSE connection opened for event:', eventId)
      onConnectionChange?.(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data: SSEData = JSON.parse(event.data)
        
        switch (data.type) {
          case 'connected':
            console.log('Connected to SSE stream for event:', data.eventId)
            break
          
          case 'signup_added':
          case 'signup_removed':
            if (data.event) {
              onEventUpdate(data.event)
            }
            break
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      onConnectionChange?.(false)
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      onConnectionChange?.(false)
    }
  }, [eventId, onEventUpdate, onConnectionChange, enabled])

  // Cleanup function
  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }

  return { disconnect }
} 