"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarDays, Users, Plus } from "lucide-react"
import { createEvent } from "./actions"
import Link from "next/link"

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Sign-Up Sheets</h1>
              <p className="text-lg text-gray-600">Create events and collect signups with shareable links</p>
            </div>
            <div className="flex-1 flex justify-end">
              <Link href="/events">
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  View All Events
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Event
            </CardTitle>
            <CardDescription>Set up your event and get a shareable link for signups</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" name="title" placeholder="Team Meeting, Potluck Dinner, etc." required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Event Date</Label>
                <Input id="date" name="date" type="datetime-local" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxSignups">Maximum Number of Signups</Label>
                <Input id="maxSignups" name="maxSignups" type="number" min="1" placeholder="e.g., 20" required />
              </div>

              <Button type="submit" className="w-full">
                Create Event & Get Link
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>Set event details</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              <span>Share the link</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Collect signups</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
