# FTTX Offline Exporter

A Prometheus exporter built with [Hono](https://hono.dev/) and [Bun](https://bun.sh/) that monitors FTTX subscriber offline statuses. 

This service acts as a bridge between multiple internal APIs:
1. **Karma (Alertmanager):** Fetches the current list of offline FTTX subscribers.
2. **Netpulse:** Verifies the bulk IP status to act as the source of truth, ignoring false positives.
3. **ONU Command Manager (Kyiv):** Retrieves detailed GPON ONU interface states (Phase, Cause, and OfflineTime).

To ensure high performance and prevent API abuse, the service employs an asynchronous background queue with a dynamic in-memory caching mechanism.

## Features

- **Blazing Fast Endpoint:** The `GET /metrics` endpoint returns data instantly (0 latency) by reading from memory.
- **Health Check:** Includes a `GET /health` endpoint for process managers and load balancers.
- **Asynchronous Queue:** Slow ONU queries are processed serially in the background with small delays to prevent DDoS-ing the ONU server.
- **Dynamic TTL Caching:** Cache expiration varies based on the cause of the outage (e.g., 60 minutes for `DyingGasp`, 20 minutes for `LOS`).
- **Garbage Collection:** Expired cache entries are automatically swept from memory to prevent memory leaks during long-running execution.
- **Code Formatting:** The codebase is formatted using [Biome](https://biomejs.dev/).

## Prerequisites

- [Bun](https://bun.sh/) installed on your system.

## Installation

1. Clone the repository or navigate to the project directory.
2. Install dependencies:
   ```bash
   bun install
   ```
3. Copy the example environment file and configure your URLs:
   ```bash
   cp .env.example .env
   ```

## Configuration

Edit the `.env` file to match your infrastructure. The `.env.example` provides safe default placeholders.

```env
# API Endpoints
ALERTS_URL=https://alerts.example.com/api/alerts.json
STATUS_API_URL=https://status.example.com/api/bulk
ONU_COMMAND_URL=http://onu-manager.example.com:8002/command

# Service Configuration
PORT=3000

# Polling Interval (in milliseconds)
POLLING_INTERVAL_MS=60000

# Dynamic Cache TTL based on ONU Cause (in milliseconds)
TTL_DYING_GASP_MS=3600000 
TTL_LOS_MS=1200000 
TTL_DEFAULT_MS=900000
```

## Usage

**Start the server in production mode:**
```bash
bun start
```

**Start the server in development mode (with hot-reload):**
```bash
bun run dev
```

## Metrics Output

The service exposes metrics at `http://localhost:3000/metrics`. 

Example output:
```text
# HELP fttx_subscriber_offline_status FTTX Subscriber Offline Status
# TYPE fttx_subscriber_offline_status gauge
fttx_subscriber_offline_status{subscriber_id="64576",subscriber_name="sely230",circuit_id="CRT2509007943",status="offline",phase="LOS",cause="LOSi",offline_time="2026-05-08 20:08:49"} 1
fttx_subscriber_offline_status{subscriber_id="61060",subscriber_name="tety152bc",circuit_id="CRT2412011083",status="offline",phase="DyingGasp",cause="DyingGasp",offline_time="2026-05-08 20:06:30"} 1
```

*(Note: During cold starts, `phase`, `cause`, and `offline_time` may temporarily show as `"pending"` until the background worker fetches the data).*

## Architecture

```text
src/
├── config/
│   └── env.ts                 # Environment variable parsing and defaults
├── domain/
│   └── models.ts              # TypeScript interfaces
├── infrastructure/
│   ├── api/                   # API Clients (Karma, Netpulse, ONU)
│   └── cache/                 # In-Memory Cache with Garbage Collection
├── application/
│   └── metricsService.ts      # Core business logic, Background Polling & Queue worker
├── presentation/
│   └── routes.ts              # Hono REST API Routes
└── index.ts                   # Entry point
```
