import { Hono } from 'hono'
import { getCachedMetrics } from '../application/metricsService'

export const routes = new Hono()

routes.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

routes.get('/metrics', (c) => {
  // Always returns instantly, even if the background job is still running
  return c.text(getCachedMetrics())
})
