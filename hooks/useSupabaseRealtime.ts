import { useEffect, useRef, useState } from 'react'
import { supabase, type Event, type Signup } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseSupabaseRealtimeProps {
  publicId: string
  initialEvent: Event & { signups: Signup[] }
  onEventUpdate: (event: Event & { signups: Signup[] }) => void
  onConnectionChange?: (connected: boolean) => void
  enabled?: boolean
}

export function useSupabaseRealtime({ 
  publicId, 
  initialEvent,
  onEventUpdate, 
  onConnectionChange, 
  enabled = true 
}: UseSupabaseRealtimeProps) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [eventId, setEventId] = useState(initialEvent.id)

  useEffect(() => {
    if (!enabled || !publicId) return

    let isSubscribed = true

    // Function to fetch the latest event data
    const fetchEvent = async () => {
      try {
        const { data: event, error } = await supabase
          .from('events')
          .select(`
            *,
            signups (*)
          `)
          .eq('public_id', publicId)
          .single()

        if (!error && event && isSubscribed) {
          console.log('Fetched updated event:', event)
          onEventUpdate({
            ...event,
            signups: event.signups || []
          })
          // Update eventId if it changed (shouldn't happen but for safety)
          if (event.id !== eventId) {
            setEventId(event.id)
          }
        } else if (error) {
          console.error('Error fetching event:', error)
        }
      } catch (err) {
        console.error('Exception in fetchEvent:', err)
      }
    }

    console.log('Creating global channel for realtime updates')

    // Create channel for realtime updates - listen globally, filter client-side
    const channel = supabase
      .channel('global-signups-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signups'
        },
        (payload) => {
          console.log('Global signup INSERT received:', payload)
          // Check if this signup is for our event
          if (payload.new && payload.new.event_id === eventId) {
            console.log('INSERT is for our event, refreshing')
            fetchEvent()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'signups'
        },
        (payload) => {
          console.log('Global signup UPDATE received:', payload)
          // Check if this signup is for our event
          if (payload.new && payload.new.event_id === eventId) {
            console.log('UPDATE is for our event, refreshing')
            fetchEvent()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'signups'
        },
        (payload) => {
          console.log('Global signup DELETE received:', payload)
          // For DELETE events, payload.old only contains the id, not event_id
          // So we refresh on any signup deletion and let the fetch determine if our event changed
          console.log('DELETE detected, refreshing to check if it affects our event')
          fetchEvent()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('Global event UPDATE received:', payload)
          // Check if this is our event
          if (payload.new && payload.new.id === eventId) {
            console.log('Event UPDATE is for our event, refreshing')
            fetchEvent()
          }
        }
      )
      .subscribe((status) => {
        console.log('Global subscription status:', status)
        const isConnected = status === 'SUBSCRIBED'
        onConnectionChange?.(isConnected)
        
        if (isConnected) {
          console.log('Global realtime connected, fetching initial data')
          // Fetch initial data when connected
          fetchEvent()
        }
      })

    channelRef.current = channel

    // Cleanup on unmount or dependency change
    return () => {
      isSubscribed = false
      if (channelRef.current) {
        console.log('Cleaning up global realtime subscription')
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      onConnectionChange?.(false)
    }
  }, [publicId, eventId, onEventUpdate, onConnectionChange, enabled])

  // Disconnect function
  const disconnect = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }

  return { disconnect }
} 