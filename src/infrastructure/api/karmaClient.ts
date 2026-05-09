import { config } from '../../config/env'
import { KarmaResponse, AlertLabel } from '../../domain/models'

export async function fetchOfflineAlerts(): Promise<AlertLabel[]> {
  const response = await fetch(config.ALERTS_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch alerts: ${response.statusText}`)
  }

  const data = (await response.json()) as KarmaResponse
  const alertList: AlertLabel[] = []

  for (const groupKey in data.groups) {
    const group = data.groups[groupKey]
    if (group.alerts) {
      for (const alert of group.alerts) {
        const labels = alert.labels || {}
        if (labels.circuit_id && labels.ip) {
          alertList.push(labels)
        }
      }
    }
  }

  return alertList
}
