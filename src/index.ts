import { Hono } from 'hono'
import { config } from './config/env'
import { startBackgroundJob } from './application/metricsService'
import { routes } from './presentation/routes'

const app = new Hono()

// Initialize application routes
app.route('/', routes)

// Start the background polling service
startBackgroundJob()

console.log(`Server is running on port ${config.PORT}`)

Bun.serve({
  port: config.PORT,
  fetch: app.fetch,
})
