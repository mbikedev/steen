// Request Manager to prevent ERR_INSUFFICIENT_RESOURCES
// Implements request queuing, throttling, and connection management

class RequestManager {
  private queue: Array<{
    fn: () => Promise<any>
    resolve: (value: any) => void
    reject: (error: any) => void
    priority: number
    timestamp: number
  }> = []
  
  private activeRequests = 0
  private maxConcurrentRequests = 6 // Increased for better throughput (mutable for resource exhaustion handling)
  private readonly requestDelay = 50 // Reduced delay for faster processing
  private isProcessing = false
  private lastRequestTime = 0

  constructor() {
    // Monitor resource usage
    if (typeof window !== 'undefined') {
      // Log memory usage periodically in development
      if (process.env.NODE_ENV === 'development') {
        setInterval(() => {
          if ((performance as any).memory) {
            const memory = (performance as any).memory
            const used = Math.round((memory.usedJSHeapSize / 1024 / 1024) * 100) / 100
            const limit = Math.round((memory.jsHeapSizeLimit / 1024 / 1024) * 100) / 100
            
            if (used > limit * 0.8) { // Warn at 80% memory usage
              console.warn(`⚠️ High memory usage: ${used}MB / ${limit}MB`)
            }
          }
        }, 10000) // Check every 10 seconds
      }
    }
  }

  // Queue a request with priority (higher number = higher priority)
  async queueRequest<T>(fn: () => Promise<T>, priority: number = 1): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      })

      // Sort by priority (high to low), then by timestamp (FIFO for same priority)
      this.queue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority // Higher priority first
        }
        return a.timestamp - b.timestamp // FIFO for same priority
      })

      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.isProcessing || this.activeRequests >= this.maxConcurrentRequests || this.queue.length === 0) {
      if (this.queue.length > 0) {
        console.log(`⏳ Queue waiting: ${this.queue.length} pending, ${this.activeRequests}/${this.maxConcurrentRequests} active, processing: ${this.isProcessing}`)
      }
      return
    }

    this.isProcessing = true
    console.log(`🔄 Processing queue: ${this.queue.length} pending, ${this.activeRequests} active`)

    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      // Throttle requests to prevent overwhelming the server
      const timeSinceLastRequest = Date.now() - this.lastRequestTime
      if (timeSinceLastRequest < this.requestDelay) {
        await new Promise(resolve => setTimeout(resolve, this.requestDelay - timeSinceLastRequest))
      }

      const request = this.queue.shift()
      if (!request) break

      this.activeRequests++
      this.lastRequestTime = Date.now()
      console.log(`▶️ Starting request (${this.activeRequests}/${this.maxConcurrentRequests} active)`)

      // Execute request
      this.executeRequest(request)
    }

    this.isProcessing = false
    console.log(`✅ Queue processing complete: ${this.queue.length} remaining, ${this.activeRequests} active`)
  }

  private async executeRequest(request: {
    fn: () => Promise<any>
    resolve: (value: any) => void
    reject: (error: any) => void
    priority: number
    timestamp: number
  }) {
    try {
      console.log(`🚀 Executing request (${this.activeRequests} active)`)
      const result = await request.fn()
      console.log(`✅ Request completed successfully`)
      request.resolve(result)
    } catch (error) {
      console.error(`❌ Request failed:`, error)
      // Check if it's a resource exhaustion error
      if (error instanceof Error && error.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
        console.warn('⚠️ Resource exhaustion detected, applying backoff')
        // Wait longer before retrying
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Reduce concurrent requests temporarily
        this.maxConcurrentRequests = Math.max(1, this.maxConcurrentRequests - 1)
        console.warn(`⚠️ Reduced max concurrent requests to: ${this.maxConcurrentRequests}`)
        
        // Retry once
        try {
          console.log(`🔄 Retrying request after resource exhaustion`)
          const result = await request.fn()
          console.log(`✅ Retry successful`)
          request.resolve(result)
        } catch (retryError) {
          console.error(`❌ Retry also failed:`, retryError)
          request.reject(retryError)
        }
      } else {
        request.reject(error)
      }
    } finally {
      this.activeRequests--
      console.log(`🏁 Request finished (${this.activeRequests} remaining active)`)
      // Process next requests
      setTimeout(() => this.processQueue(), this.requestDelay)
    }
  }

  // Get queue status for debugging
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrentRequests: this.maxConcurrentRequests,
      isProcessing: this.isProcessing
    }
  }

  // Clear queue (emergency)
  clearQueue() {
    console.warn('🚨 Clearing request queue due to emergency')
    this.queue.forEach(request => {
      request.reject(new Error('Request cancelled due to resource exhaustion'))
    })
    this.queue = []
  }
}

// Singleton instance
export const requestManager = new RequestManager()

// High-level wrapper for database operations
export async function executeWithResourceControl<T>(
  operation: () => Promise<T>,
  priority: number = 1,
  operationName?: string
): Promise<T> {
  if (operationName) {
    console.log(`🔄 Executing ${operationName} (priority: ${priority}) - DIRECT MODE`)
  }
  
  try {
    // Temporarily bypass queue for debugging - execute directly
    const result = await operation()
    if (operationName) {
      console.log(`✅ Completed ${operationName}`)
    }
    return result
  } catch (error) {
    if (operationName) {
      console.error(`❌ Failed ${operationName}:`, error)
    }
    throw error
  }
}