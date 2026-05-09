import { config } from '../../config/env'
import { OnuData } from '../../domain/models'

export async function fetchOnuStatus(circuitId: string): Promise<OnuData> {
  const url = `${config.ONU_COMMAND_URL}?customerID=${circuitId}&commandName=ONUInterfaceStatus`
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ONU status for ${circuitId}: ${response.statusText}`,
    )
  }

  const data = (await response.json()) as any
  let phase = 'N/A'
  let cause = 'N/A'
  let offlineTime = 'N/A'

  if (data.result && data.result[0]) {
    const commandOutput = data.result[0].command_return
    const phaseMatch = commandOutput.match(/Phase state:\s+(\S+)/)
    if (phaseMatch) phase = phaseMatch[1]

    const lines = commandOutput.split('\n')
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(
        /\s+\d+\s+[\d-]+\s+[\d:]+\s+([\d-]+\s+[\d:]+)\s+(\S+)/,
      )
      if (match) {
        offlineTime = match[1]
        cause = match[2]
        break
      }
    }
  }

  return { phase, cause, offlineTime }
}
