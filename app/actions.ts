"use server"

import { supabase, type Event, type Signup } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { generatePublicId } from "@/lib/utils"

export async function createEvent(formData: FormData) {
  const title = formData.get("title") as string
  const date = formData.get("date") as string
  const maxSignups = Number(formData.get("maxSignups"))

  let publicId = ''
  let retries = 0
  const maxRetries = 5

  // Try to insert with a unique public_id, retry if it already exists
  while (retries < maxRetries) {
    publicId = generatePublicId()
    
    const event: Omit<Event, 'id' | 'created_at'> = {
      public_id: publicId,
      title,
      date,
      max_signups: maxSignups,
    }

    // Store event in Supabase
    const { error } = await supabase
      .from('events')
      .insert(event)

    if (!error) {
      // Success!
      break
    } else if (error.code === '23505' && error.message.includes('public_id')) {
      // Unique constraint violation on public_id, try again
      retries++
      continue
    } else {
      // Some other error
      throw new Error(`Failed to create event: ${error.message}`)
    }
  }

  if (retries >= maxRetries) {
    throw new Error('Failed to generate unique event ID after multiple attempts')
  }

  redirect(`/event/${publicId}`)
}

export async function getEvent(publicId: string): Promise<Event & { signups: Signup[] } | null> {
  // Get event with signups using public_id
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      signups (*)
    `)
    .eq('public_id', publicId)
    .single()

  if (error || !event) {
    return null
  }

  return {
    ...event,
    signups: event.signups || []
  }
}

export async function getAllEvents(): Promise<Event[]> {
  // Get all events
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !events) {
    return []
  }

  return events
}

export async function addSignup(publicId: string, name: string) {
  // First check if the event exists and get current signup count
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(`
      *,
      signups (*)
    `)
    .eq('public_id', publicId)
    .single()

  if (eventError || !event) {
    throw new Error("Event not found")
  }

  // Check if name already exists (case-insensitive)
  const trimmedName = name.trim()
  const existingSignup = event.signups.find((s: Signup) => 
    s.name.toLowerCase() === trimmedName.toLowerCase()
  )
  if (existingSignup) {
    throw new Error("Name already signed up")
  }

  // Add signup using the event's actual ID
  const { error: signupError } = await supabase
    .from('signups')
    .insert({
      event_id: event.id,
      name: trimmedName
    })

  if (signupError) {
    // Handle unique constraint violation gracefully
    if (signupError.code === '23505') {
      throw new Error("Name already signed up")
    }
    throw new Error(`Failed to add signup: ${signupError.message}`)
  }

  // Return updated event
  return getEvent(publicId)
}

export async function removeSignup(publicId: string, name: string) {
  console.log(`Attempting to remove signup: ${name} from event: ${publicId}`)
  
  // First get the event to find its ID
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('public_id', publicId)
    .single()

  if (eventError || !event) {
    console.error('Event not found:', eventError)
    throw new Error("Event not found")
  }

  console.log(`Found event with ID: ${event.id}`)

  const trimmedName = name.trim()

  // Check if the signup exists (using case-insensitive search)
  const { data: signup, error: findError } = await supabase
    .from('signups')
    .select('*')
    .eq('event_id', event.id)
    .ilike('name', trimmedName)
    .single()

  if (findError || !signup) {
    console.error('Signup not found:', findError)
    throw new Error("Name not found in signup list")
  }

  console.log(`Found signup to delete:`, signup)

  // Remove signup using the actual name from the database
  const { error: deleteError } = await supabase
    .from('signups')
    .delete()
    .eq('id', signup.id)

  if (deleteError) {
    console.error('Delete failed:', deleteError)
    throw new Error(`Failed to remove signup: ${deleteError.message}`)
  }

  console.log(`Successfully deleted signup with ID: ${signup.id}`)

  // Return updated event
  const updatedEvent = await getEvent(publicId)
  console.log(`Returning updated event:`, updatedEvent)
  return updatedEvent
}

export async function deleteEvent(publicId: string) {
  // Check if event exists
  const { data: event, error: findError } = await supabase
    .from('events')
    .select('*')
    .eq('public_id', publicId)
    .single()

  if (findError || !event) {
    throw new Error("Event not found")
  }

  // Delete event (cascades to signups)
  const { error: deleteError } = await supabase
    .from('events')
    .delete()
    .eq('public_id', publicId)

  if (deleteError) {
    throw new Error(`Failed to delete event: ${deleteError.message}`)
  }

  redirect("/events")
}
