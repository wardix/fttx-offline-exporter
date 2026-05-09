export const config = {
  ALERTS_URL:
    process.env.ALERTS_URL || 'https://alerts.example.com/api/alerts.json',
  STATUS_API_URL:
    process.env.STATUS_API_URL || 'https://status.example.com/api/bulk',
  ONU_COMMAND_URL:
    process.env.ONU_COMMAND_URL ||
    'http://onu-manager.example.com:8002/command',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  POLLING_INTERVAL_MS: process.env.POLLING_INTERVAL_MS
    ? parseInt(process.env.POLLING_INTERVAL_MS, 10)
    : 60 * 1000,
  TTL_DYING_GASP_MS: process.env.TTL_DYING_GASP_MS
    ? parseInt(process.env.TTL_DYING_GASP_MS, 10)
    : 60 * 60 * 1000,
  TTL_LOS_MS: process.env.TTL_LOS_MS
    ? parseInt(process.env.TTL_LOS_MS, 10)
    : 20 * 60 * 1000,
  TTL_DEFAULT_MS: process.env.TTL_DEFAULT_MS
    ? parseInt(process.env.TTL_DEFAULT_MS, 10)
    : 15 * 60 * 1000,
}
