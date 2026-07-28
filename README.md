# mastra-anakin

Mastra tools for [Anakin](https://anakin.io) — web scraping, AI-powered
search, and multi-stage agentic research over hundreds of popular sites — as
`createTool()`-based tools for Mastra agents.

## What's covered

Three tools, matching the same baseline every other single-purpose Anakin
integration built this session covers:

- **`anakin-url-scraper`** (`createAnakinUrlScraperTool`) — submits
  `POST /url-scraper`, then polls `GET /url-scraper/:jobId` until the job
  completes or fails. Returns markdown (plus optionally HTML, links, images,
  screenshots, or AI-generated structured JSON).
- **`anakin-search`** (`createAnakinSearchTool`) — calls `POST /search`.
  Synchronous, no polling. Costs 3 credits per call.
- **`anakin-agentic-search`** (`createAnakinAgenticSearchTool`) — submits
  `POST /agentic-search`, then polls `GET /agentic-search/:jobId`. Returns an
  AI-generated summary plus structured data matching an optional
  caller-supplied JSON Schema. Costs 10 credits per call.

Each is a real `createTool()` call from `@mastra/core/tools` with a Zod
`inputSchema`/`outputSchema` and an `execute` function — the current
documented Mastra tool pattern (sources in `SUBMIT.md`). `createAnakinTools()`
returns all three as a single object for convenience.

## Install

```sh
npm install mastra-anakin
```

Peer dependencies: `@mastra/core >=1.0.0-0 <2.0.0-0` and
`zod ^3.25.0 || ^4.0.0` — whatever your Mastra project already has installed.

## Usage

```ts
import { Agent } from '@mastra/core/agent';
import { createAnakinTools } from 'mastra-anakin';

const tools = createAnakinTools({ apiKey: process.env.ANAKIN_API_KEY });

const researchAgent = new Agent({
  name: 'research-agent',
  instructions: 'You research topics on the web using Anakin.',
  model: /* your model */,
  tools,
});
```

Or import a single tool:

```ts
import { createAnakinSearchTool } from 'mastra-anakin';

const searchTool = createAnakinSearchTool({ apiKey: process.env.ANAKIN_API_KEY });
```

`apiKey` is optional if `ANAKIN_API_KEY` is set in the environment. Get a
free API key at [anakin.io/dashboard](https://anakin.io/dashboard) — 500
credits, no card required.

## Auth

Anakin uses a static API key sent as the `X-API-Key` header. Pass it via
`apiKey` in the config object given to each tool creator, or set
`ANAKIN_API_KEY` in the environment — `getAnakinClient()` in `src/client.ts`
falls back to the env var when `apiKey` is omitted, and throws a clear error
if neither is set.

## Polling

`anakin-url-scraper` and `anakin-agentic-search` are asynchronous on Anakin's
side: submit, then poll. Unlike a sandboxed Pack/formula runtime with a hard
execution ceiling (see the `coda-anakin` submission's "Limitation" section
for that problem), a Mastra tool's `execute()` runs inside your own
long-lived agent process, so there's no platform-imposed time limit here.
`submitAndPoll()` in `src/client.ts` polls on an exponential backoff (2s
initial, capped at 10s) with a 120s total budget by default — all three
configurable via `pollIntervalMs` / `pollMaxIntervalMs` / `pollTimeoutMs` in
the config object — and throws if the job fails or the budget is exceeded.

## Test

```sh
npm test
```

## Build

```sh
npm run build
```
