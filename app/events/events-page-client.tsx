"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Users, Clock, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import type { Event } from "@/lib/redis"

interface EventsPageClientProps {
  events: Event[]
}

export function EventsPageClient({ events }: EventsPageClientProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  }

  const getStatusBadge = (event: Event) => {
    const confirmedCount = Math.min(event.signups.length, event.maxSignups)
    const waitlistCount = Math.max(0, event.signups.length - event.maxSignups)
    
    if (confirmedCount === event.maxSignups && waitlistCount > 0) {
      return <Badge variant="secondary">Full + Waitlist</Badge>
    } else if (confirmedCount === event.maxSignups) {
      return <Badge variant="destructive">Full</Badge>
    } else if (event.maxSignups - confirmedCount <= 3) {
      return <Badge variant="secondary">Few spots left</Badge>
    } else {
      return <Badge variant="default">Open</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">All Events</h1>
            <p className="text-lg text-gray-600">View and join available events</p>
          </div>
          <Link href="/">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Event
            </Button>
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">No events yet</h2>
            <p className="text-gray-600 mb-6">Be the first to create an event!</p>
            <Link href="/">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const confirmedCount = Math.min(event.signups.length, event.maxSignups)
              const waitlistCount = Math.max(0, event.signups.length - event.maxSignups)
              
              return (
                <Card key={event.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 line-clamp-2">{event.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 text-sm">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(event.date)}
                        </CardDescription>
                      </div>
                      {getStatusBadge(event)}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">
                              {confirmedCount} / {event.maxSignups} confirmed
                            </span>
                          </div>
                          {waitlistCount > 0 && (
                            <span className="text-xs text-amber-600 ml-5">
                              + {waitlistCount} waitlisted
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${Math.min((confirmedCount / event.maxSignups) * 100, 100)}%` 
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        Created {new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
                          Math.floor((new Date(event.createdAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                          'day'
                        )}
                      </div>

                      <Link href={`/event/${event.id}`} className="block w-full">
                        <Button variant="outline" className="w-full flex items-center gap-2">
                          View Event
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 