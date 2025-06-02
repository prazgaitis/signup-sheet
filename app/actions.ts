"use server"

import { redis, type Event } from "@/lib/redis"
import { redirect } from "next/navigation"

export async function createEvent(formData: FormData) {
  const title = formData.get("title") as string
  const date = formData.get("date") as string
  const maxSignups = Number(formData.get("maxSignups"))

  // Generate unique short ID
  const eventId = Math.random().toString(36).substring(2, 8)

  const event: Event = {
    id: eventId,
    title,
    date,
    maxSignups,
    signups: [],
    createdAt: new Date().toISOString(),
  }

  // Store event in Redis
  await redis.set(`event:${eventId}`, event)

  // Also add to events list for potential future listing
  await redis.sadd("events", eventId)

  redirect(`/event/${eventId}`)
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const event = await redis.get(`event:${eventId}`)
  return event as Event | null
}

export async function getAllEvents(): Promise<Event[]> {
  // Get all event IDs from the events set
  const eventIds = await redis.smembers("events")
  
  if (!eventIds || eventIds.length === 0) {
    return []
  }

  // Get all events in parallel
  const eventPromises = eventIds.map(id => redis.get(`event:${id}`))
  const events = await Promise.all(eventPromises)
  
  // Filter out null values and ensure type safety
  const validEvents = events.filter((event): event is Event => event !== null)
  
  // Sort by creation date (newest first)
  return validEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function addSignup(eventId: string, name: string) {
  const event = await getEvent(eventId)

  if (!event) {
    throw new Error("Event not found")
  }

  if (event.signups.length >= event.maxSignups) {
    throw new Error("Event is full")
  }

  if (event.signups.includes(name.trim())) {
    throw new Error("Name already signed up")
  }

  // Add signup to event
  const updatedEvent = {
    ...event,
    signups: [...event.signups, name.trim()],
  }

  // Update event in Redis
  await redis.set(`event:${eventId}`, updatedEvent)

  return updatedEvent
}

export async function removeSignup(eventId: string, name: string) {
  const event = await getEvent(eventId)

  if (!event) {
    throw new Error("Event not found")
  }

  if (!event.signups.includes(name.trim())) {
    throw new Error("Name not found in signup list")
  }

  // Remove signup from event
  const updatedEvent = {
    ...event,
    signups: event.signups.filter(signup => signup !== name.trim()),
  }

  // Update event in Redis
  await redis.set(`event:${eventId}`, updatedEvent)

  return updatedEvent
}
