"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Users, Share2, Copy, Check, ArrowLeft, X } from "lucide-react"
import { addSignup, removeSignup } from "@/app/actions"
import type { Event } from "@/lib/redis"
import Link from "next/link"

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSigningUp(true)
    setError("")

    try {
      // Perform the actual signup
      await addSignup(event.id, name.trim())

      // Update the local state after successful signup
      setEvent(prevEvent => ({
        ...prevEvent,
        signups: [...prevEvent.signups, name.trim()],
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
        signups: prevEvent.signups.filter(signup => signup !== nameToRemove),
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

  const isFull = event.signups.length >= event.maxSignups
  const spotsLeft = event.maxSignups - event.signups.length

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
                <CardTitle className="text-xl sm:text-2xl mb-2">{event.title}</CardTitle>
                <CardDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-sm sm:text-base">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(event.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {event.signups.length}/{event.maxSignups} signed up
                  </span>
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={copyLink} className="self-start">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2">{copied ? "Copied!" : "Copy Link"}</span>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Signup Form */}
        {!isFull && (
          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>
                {spotsLeft === 1 ? "Only 1 spot left!" : `${spotsLeft} spots remaining`}
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
                  {isSigningUp ? "Signing Up..." : "I'm In!"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Full Event Notice */}
        {isFull && (
          <Card className="shadow-lg mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6 text-center">
              <Badge variant="secondary" className="mb-2">
                Event Full
              </Badge>
              <p className="text-gray-600">This event has reached its maximum capacity.</p>
            </CardContent>
          </Card>
        )}

        {/* Signups List */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Who's Coming ({event.signups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {event.signups.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No signups yet. Be the first!</p>
            ) : (
              <div className="space-y-2">
                {event.signups.map((signup, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{signup}</span>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(signup)}
                      disabled={removingNames.has(signup)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {removingNames.has(signup) ? (
                        "Removing..."
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
