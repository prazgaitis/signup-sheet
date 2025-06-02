import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export interface Signup {
  name: string
  timestamp: string
}

export interface Event {
  id: string
  title: string
  date: string
  maxSignups: number
  signups: Signup[]
  createdAt: string
}

export { redis }
