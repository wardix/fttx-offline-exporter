# FTTX Offline Exporter - Project Guidelines

This file contains team-shared architectural decisions, coding conventions, and best practices for the `fttx-offline-exporter` project.

## 1. Technology Stack
- **Runtime:** Bun
- **Language:** TypeScript (Strict Mode)
- **Web Framework:** Hono
- **Output:** Prometheus Metrics Format
- **Formatter:** Biome (Indent: space, Width: 2, Quotes: single, Semicolons: asNeeded)

## 2. Architecture
The project strictly follows a **Layered Architecture** to ensure separation of concerns. Do not bypass layers.

- **`src/config/`**: Environment variable parsing and default configuration. All configuration must be centralized here.
- **`src/domain/`**: TypeScript interfaces and types representing the data structures (e.g., `Alert`, `OnuData`). No business logic here.
- **`src/infrastructure/`**: Interaction with external systems.
  - **`api/`**: API clients (`karmaClient.ts`, `netpulseClient.ts`, `onuClient.ts`). Each client should handle its own specific fetching logic and basic parsing/error throwing.
  - **`cache/`**: In-memory caching mechanisms (e.g., `onuCache.ts`) with garbage collection.
- **`src/application/`**: Core business logic (`metricsService.ts`). This layer orchestrates data from infrastructure, implements the background polling, queue processing, and formats the final metrics string.
- **`src/presentation/`**: REST API endpoints (`routes.ts`). Should be extremely thin and only return data provided by the application layer. Must include a `/health` endpoint for process monitoring.

## 3. Core Principles
- **Instant Responses:** The `/metrics` endpoint must **never** block or perform external HTTP requests. It must always read from an instantly available in-memory string.
- **Background Polling:** Data aggregation happens via background `setInterval` polling.
- **Queueing Slow Requests:** Any interaction with slow external APIs (like the Kyiv ONU Command API) must be decoupled from the main polling loop using an asynchronous queue processed serially with delays to prevent DDoS-ing internal servers.
- **Source of Truth Priority:** Always respect validation services (e.g., Netpulse reporting a device as 'online') over stale cached data or initial alert sources.
- **Garbage Collection:** Any in-memory cache implementation must include a mechanism to sweep expired entries to prevent memory leaks during long-running execution.

## 4. Coding Conventions
- **Naming:** Use `camelCase` for variables and functions, `PascalCase` for Interfaces and Classes.
- **Variables:** Prefer `const` over `let`. Avoid global variables unless strictly necessary for caching mechanisms initialized at the application level.
- **Error Handling:** Catch errors gracefully in the background jobs. Log them using `console.error` but do not crash the application.
- **Types:** Always define and use TypeScript interfaces for external API responses. Avoid `any` where possible, though it is currently tolerated during initial API JSON parsing before mapping to domain models.

## 5. Security & Credentials
- NEVER commit `.env` files or hardcode real infrastructure URLs, tokens, or credentials in the codebase.
- Use generic placeholders (e.g., `https://alerts.example.com`) in `.env.example` and `src/config/env.ts` defaults.
