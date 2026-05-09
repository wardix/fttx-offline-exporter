import { config } from '../../config/env'
import { NetpulseStatus } from '../../domain/models'

export async function fetchBulkIpStatus(
  ips: string[],
): Promise<Map<string, string>> {
  if (ips.length === 0) return new Map()

  const response = await fetch(config.STATUS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ips: [...new Set(ips)] }),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch bulk IP status: ${response.statusText}`)
  }

  const statusData = (await response.json()) as NetpulseStatus[]
  const statusMap = new Map<string, string>()

  statusData.forEach((item) => {
    const ip = item.ip_address || item.ip
    if (ip) {
      statusMap.set(ip, item.status)
    }
  })

  return statusMap
}
