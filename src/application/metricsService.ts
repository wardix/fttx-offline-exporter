import { config } from '../config/env'
import { onuCache } from '../infrastructure/cache/onuCache'
import { fetchOfflineAlerts } from '../infrastructure/api/karmaClient'
import { fetchBulkIpStatus } from '../infrastructure/api/netpulseClient'
import { fetchOnuStatus } from '../infrastructure/api/onuClient'

// Global cache for the final metrics text
let cachedMetricsOutput =
  '# HELP fttx_subscriber_offline_status FTTX Subscriber Offline Status\n# TYPE fttx_subscriber_offline_status gauge\n'

export function getCachedMetrics(): string {
  return cachedMetricsOutput
}

const fetchQueue = new Set<string>()
let isQueueProcessing = false
let isPolling = false

async function processFetchQueue() {
  if (isQueueProcessing) return
  isQueueProcessing = true

  try {
    for (const circuitId of fetchQueue) {
      fetchQueue.delete(circuitId)

      const now = Date.now()
      const cachedData = onuCache.get(circuitId)

      if (cachedData && now < cachedData.expireAt) {
        continue
      }

      console.log(`[Queue] Fetching ONU status for ${circuitId}...`)
      try {
        const onuData = await fetchOnuStatus(circuitId)

        let ttl = config.TTL_DEFAULT_MS
        if (onuData.cause === 'DyingGasp') {
          ttl = config.TTL_DYING_GASP_MS
        } else if (onuData.cause === 'LOS' || onuData.cause === 'LOSi') {
          ttl = config.TTL_LOS_MS
        }

        const expireAt = now + ttl
        onuCache.set(circuitId, { ...onuData, expireAt })
        console.log(
          `[Queue] Saved ${circuitId} to cache (Phase: ${onuData.phase}, Cause: ${onuData.cause}).`,
        )
      } catch (e) {
        console.error(`[Queue] Error fetching ONU status for ${circuitId}`)
      }

      // Small delay between fetches to prevent overwhelming the ONU server
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  } finally {
    isQueueProcessing = false
    if (fetchQueue.size > 0) {
      setTimeout(processFetchQueue, 1000)
    }
  }
}

export async function pollMetricsBackground(): Promise<void> {
  if (isPolling) return
  isPolling = true

  try {
    console.log(`[${new Date().toISOString()}] Starting fast metrics update...`)
    onuCache.cleanupExpired()

    let output =
      '# HELP fttx_subscriber_offline_status FTTX Subscriber Offline Status\n'
    output += '# TYPE fttx_subscriber_offline_status gauge\n'

    const alertList = await fetchOfflineAlerts()
    const ips = alertList.map((a) => a.ip).filter((ip): ip is string => !!ip)

    if (ips.length === 0) {
      cachedMetricsOutput = output
      console.log(
        `[${new Date().toISOString()}] Fast update complete. No offline alerts found.`,
      )
      return
    }

    const statusMap = await fetchBulkIpStatus(ips)
    const now = Date.now()
    let queueAddedCount = 0

    for (const alert of alertList) {
      if (!alert.ip || !alert.circuit_id) continue

      const status = statusMap.get(alert.ip) || 'unknown'
      if (status === 'online') continue

      const circuitId = alert.circuit_id
      const cachedData = onuCache.get(circuitId)

      let phase = 'pending'
      let cause = 'pending'
      let offlineTime = 'pending'

      if (cachedData && now < cachedData.expireAt) {
        phase = cachedData.phase
        cause = cachedData.cause
        offlineTime = cachedData.offlineTime
      } else {
        fetchQueue.add(circuitId)
        queueAddedCount++
      }

      if (phase === 'working') continue

      const subId = alert.subscriber_id || 'N/A'
      const subName = (alert.subscriber_name || 'N/A').replace(/"/g, '\\"')

      output += `fttx_subscriber_offline_status{subscriber_id="${subId}",subscriber_name="${subName}",circuit_id="${circuitId}",status="${status}",cause="${cause}",offline_time="${offlineTime}"} 1\n`
    }

    cachedMetricsOutput = output
    console.log(
      `[${new Date().toISOString()}] Fast update complete. Added ${queueAddedCount} items to ONU fetch queue.`,
    )

    if (queueAddedCount > 0) {
      processFetchQueue()
    }
  } catch (error) {
    console.error('Error fetching general alerts/status:', error)
  } finally {
    isPolling = false
  }
}

export function startBackgroundJob(): void {
  pollMetricsBackground()
  setInterval(pollMetricsBackground, config.POLLING_INTERVAL_MS)
}
