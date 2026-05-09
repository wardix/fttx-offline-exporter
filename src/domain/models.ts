export interface AlertLabel {
  subscriber_id?: string
  subscriber_name?: string
  circuit_id?: string
  ip?: string
}

export interface Alert {
  labels: AlertLabel
}

export interface AlertGroup {
  alerts: Alert[]
}

export interface KarmaResponse {
  groups: { [key: string]: AlertGroup }
}

export interface NetpulseStatus {
  ip_address?: string
  ip?: string
  status: string
}

export interface OnuData {
  phase: string
  cause: string
  offlineTime: string
}

export interface OnuCacheEntry extends OnuData {
  expireAt: number
}
