import { getAllEvents } from "@/app/actions"
import { EventsPageClient } from "./events-page-client"

export default async function EventsPage() {
  const events = await getAllEvents()

  return <EventsPageClient events={events} />
} 