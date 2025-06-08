// Store active connections for each event
const connections = new Map<string, Set<ReadableStreamDefaultController>>()

export class SSEManager {
  static addConnection(eventId: string, controller: ReadableStreamDefaultController) {
    if (!connections.has(eventId)) {
      connections.set(eventId, new Set())
    }
    connections.get(eventId)!.add(controller)
  }

  static removeConnection(eventId: string, controller: ReadableStreamDefaultController) {
    const eventConnections = connections.get(eventId)
    if (eventConnections) {
      eventConnections.delete(controller)
      if (eventConnections.size === 0) {
        connections.delete(eventId)
      }
    }
  }

  static broadcast(eventId: string, data: any) {
    const eventConnections = connections.get(eventId)
    if (!eventConnections || eventConnections.size === 0) return

    const encoder = new TextEncoder()
    const message = encoder.encode(`data: ${JSON.stringify(data)}\n\n`)

    // Send to all connected clients for this event
    const toRemove: ReadableStreamDefaultController[] = []
    
    eventConnections.forEach((controller) => {
      try {
        controller.enqueue(message)
      } catch (error) {
        // Mark broken connections for removal
        toRemove.push(controller)
      }
    })

    // Remove broken connections
    toRemove.forEach(controller => {
      eventConnections.delete(controller)
    })

    // Clean up if no connections remain
    if (eventConnections.size === 0) {
      connections.delete(eventId)
    }
  }

  static getConnectionCount(eventId: string): number {
    return connections.get(eventId)?.size || 0
  }
} 