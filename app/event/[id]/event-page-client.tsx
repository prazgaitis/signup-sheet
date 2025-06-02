"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Users, Share2, Copy, Check, ArrowLeft, X, Clock, UserPlus, Trash2, MoreVertical } from "lucide-react"
import { addSignup, removeSignup, deleteEvent } from "@/app/actions"
import type { Event, Signup } from "@/lib/redis"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface EventPageClientProps {
  event: Event
}

export function EventPageClient({ event: initialEvent }: EventPageClientProps) {
  const [event, setEvent] = useState(initialEvent)
  const [name, setName] = useState("")
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [removingNames, setRemovingNames] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSigningUp(true)
    setError("")

    try {
      // Perform the actual signup
      await addSignup(event.id, name.trim())

      // Update the local state after successful signup
      const newSignup: Signup = {
        name: name.trim(),
        timestamp: new Date().toISOString()
      }

      setEvent(prevEvent => ({
        ...prevEvent,
        signups: [...prevEvent.signups, newSignup],
      }))

      setName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up")
    } finally {
      setIsSigningUp(false)
    }
  }

  const handleRemove = async (nameToRemove: string) => {
    setRemovingNames(prev => new Set(prev).add(nameToRemove))
    setError("")

    try {
      // Perform the actual removal
      await removeSignup(event.id, nameToRemove)

      // Update the local state after successful removal
      setEvent(prevEvent => ({
        ...prevEvent,
        signups: prevEvent.signups.filter(signup => signup.name !== nameToRemove),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove signup")
    } finally {
      setRemovingNames(prev => {
        const newSet = new Set(prev)
        newSet.delete(nameToRemove)
        return newSet
      })
    }
  }

  const copyLink = async () => {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeleteEvent = async () => {
    setIsDeleting(true)
    setError("")

    try {
      await deleteEvent(event.id)
      // The deleteEvent action will redirect to /events, so we don't need to do anything else here
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event")
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const formatSignupTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  // Split signups into confirmed and waitlisted
  const confirmedSignups = event.signups.slice(0, event.maxSignups)
  const waitlistedSignups = event.signups.slice(event.maxSignups)
  const isFull = confirmedSignups.length >= event.maxSignups
  const spotsLeft = event.maxSignups - confirmedSignups.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Back Navigation */}
        <div className="mb-4">
          <Link href="/events">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to All Events
            </Button>
          </Link>
        </div>

        {/* Event Header */}
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-xl sm:text-2xl">{event.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="sm:hidden">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-sm sm:text-base">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(event.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {confirmedSignups.length}/{event.maxSignups} confirmed
                    {waitlistedSignups.length > 0 && (
                      <span className="text-amber-600">
                        + {waitlistedSignups.length} waitlisted
                      </span>
                    )}
                  </span>
                </CardDescription>
              </div>
              <div className="hidden sm:flex sm:flex-row gap-2">
                <Button variant="outline" size="sm" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-2">{copied ? "Copied!" : "Copy Link"}</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Event
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="sm:hidden mt-4">
              <Button variant="outline" size="sm" onClick={copyLink} className="w-full">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2">{copied ? "Copied!" : "Copy Link"}</span>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Delete Event?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{event.title}" and all {event.signups.length} signups. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete Event"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Signup Form */}
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Sign Up
            </CardTitle>
            <CardDescription>
              {!isFull ? (
                spotsLeft === 1 ? "Only 1 spot left!" : `${spotsLeft} spots remaining`
              ) : (
                "Event is full - you'll be added to the waitlist"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <Button type="submit" className="w-full" disabled={isSigningUp}>
                {isSigningUp ? "Signing Up..." : isFull ? "Join Waitlist" : "I'm In!"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Confirmed Signups */}
        {confirmedSignups.length > 0 && (
          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Confirmed Attendees ({confirmedSignups.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {confirmedSignups.map((signup, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{signup.name}</span>
                        <Badge variant="default">#{index + 1}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Signed up {formatSignupTime(signup.timestamp)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(signup.name)}
                      disabled={removingNames.has(signup.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {removingNames.has(signup.name) ? (
                        "Removing..."
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waitlisted Signups */}
        {waitlistedSignups.length > 0 && (
          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Waitlist ({waitlistedSignups.length})
              </CardTitle>
              <CardDescription>
                People on the waitlist will be automatically moved to confirmed if spots become available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {waitlistedSignups.map((signup, index) => (
                  <div key={index + event.maxSignups} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-amber-800">{signup.name}</span>
                        <Badge variant="secondary">Waitlist #{index + 1}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <Clock className="h-3 w-3" />
                        <span>Joined waitlist {formatSignupTime(signup.timestamp)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(signup.name)}
                      disabled={removingNames.has(signup.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {removingNames.has(signup.name) ? (
                        "Removing..."
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {event.signups.length === 0 && (
          <Card className="shadow-lg">
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No signups yet. Be the first!</p>
            </CardContent>
          </Card>
        )}

        {/* Share Section */}
        {/* <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share This Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={typeof window !== "undefined" ? window.location.href : ""}
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Share this link with others so they can sign up for your event.
            </p>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}
