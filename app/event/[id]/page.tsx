import { getEvent } from "@/app/actions"
import { EventPageClient } from "./event-page-client"

interface EventPageProps {
  params: Promise<{ id: string }>
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params
  const event = await getEvent(id)

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
          <p className="text-gray-600">This event doesn't exist or may have been removed.</p>
        </div>
      </div>
    )
  }

  return <EventPageClient event={event} />
}
