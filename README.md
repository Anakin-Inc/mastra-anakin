# mastra-anakin

Mastra tools for [Anakin](https://anakin.io) — web scraping, site mapping and
crawling, AI-powered search, Wire's pre-built site actions, website
monitoring, AI-visibility comparison, browser-session management, and
AI-driven browser automation — as `createTool()`-based tools for Mastra
agents.

## What's covered

All 21 of Anakin's REST endpoints, each a real `createTool()` call from
`@mastra/core/tools` with a Zod `inputSchema`/`outputSchema` and an `execute`
function — the current documented Mastra tool pattern (sources in
`SUBMIT.md`). `createAnakinTools()` returns all 21 as a single object for
convenience; every tool is also individually exported for a la carte use.

| Tool (`createTool` id) | Factory | What it does |
| --- | --- | --- |
| `anakin-url-scraper` | `createAnakinUrlScraperTool` | Scrape a single URL to markdown/HTML/JSON. `POST /url-scraper` → poll. |
| `anakin-search` | `createAnakinSearchTool` | AI-powered web search. `POST /search`, synchronous. |
| `anakin-agentic-search` | `createAnakinAgenticSearchTool` | Multi-page AI research with structured extraction. `POST /agentic-search` → poll. |
| `anakin-map` | `createAnakinMapTool` | Discover a site's reachable URLs. `POST /map` → poll. |
| `anakin-crawl` | `createAnakinCrawlTool` | Bulk-fetch markdown across many pages. `POST /crawl` → poll. |
| `anakin-wire-discover` | `createAnakinWireDiscoverTool` | Find Wire actions from a natural-language intent. `GET /wire/resolve`. |
| `anakin-wire-catalog` | `createAnakinWireCatalogTool` | Browse the Wire catalog, or one site's full action list. `GET /wire/catalog[/:slug]`. |
| `anakin-wire-read-action` | `createAnakinWireReadActionTool` | Run a read-only Wire action. `POST /wire/task` → inline or poll `GET /wire/jobs/:jobId`. |
| `anakin-wire-write-action` | `createAnakinWireWriteActionTool` | Run a state-changing Wire action. Same endpoint as read; destructive. |
| `anakin-wire-identities` | `createAnakinWireIdentitiesTool` | List saved Wire identities/credentials. `GET /wire/identities`. |
| `anakin-wire-login` | `createAnakinWireLoginTool` | Sign in to a credentials-mode Wire site. `POST /wire/login`. Destructive. |
| `anakin-wire-build` | `createAnakinWireBuildTool` | Request a new Wire action for an uncataloged site. `POST /wire/build-request`. Destructive. |
| `anakin-monitor-create` | `createAnakinMonitorCreateTool` | Create a scheduled website monitor. `POST /monitors`. Destructive. |
| `anakin-monitor-list` | `createAnakinMonitorListTool` | List monitors, or fetch one by id. `GET /monitors[/:id]`. |
| `anakin-monitor-changes` | `createAnakinMonitorChangesTool` | Get a monitor's detected changes. `GET /monitors/:id/changes`. |
| `anakin-monitor-control` | `createAnakinMonitorControlTool` | Pause/resume/run-now/delete a monitor. `POST .../{pause,resume,run}` or `DELETE`. Destructive. |
| `anakin-ai-visibility-search` | `createAnakinAiVisibilitySearchTool` | Compare AI answer engines on one query. `POST /ai-visibility/search` → poll. |
| `anakin-ai-visibility-sources` | `createAnakinAiVisibilitySourcesTool` | List available AI answer engines. `GET /ai-visibility/sources`. |
| `anakin-session-list` | `createAnakinSessionListTool` | List saved browser sessions. `GET /sessions`. |
| `anakin-session-delete` | `createAnakinSessionDeleteTool` | Delete a saved browser session. `DELETE /sessions/:id`. Destructive. |
| `anakin-browser-task` | `createAnakinBrowserTaskTool` | Run a natural-language task in an AI-driven cloud browser. `POST /ai/evaluate` (async) → poll. Destructive. |

"Destructive" above means the call has a side effect on a real external
system (state-changing site interaction, stored credential, billed recurring
job, irreversible deletion) — Mastra's `createTool()` has no
`readOnlyHint`/`destructiveHint` annotation slot like MCP tool schemas do, so
each such tool says so directly in its `description` instead, and callers
should gate these behind explicit user intent the same way they would any
other side-effecting tool call.

## Design notes on the newer tools

- **Wire's read/write split.** `anakin-wire-read-action` and
  `anakin-wire-write-action` both call `POST /wire/task`, and the API does
  not itself reject a "read" action_id from the write tool or vice versa —
  the split exists purely so each tool can carry an honest, un-hedged
  description (matching the read/write tool split Anakin's own MCP server
  uses for the same reason; see `src/wireActionShared.ts`).
- **Two ways a Wire task finishes.** `POST /wire/task` returns either the
  result inline (sync actions) or a `job_id` to poll. Anakin's job-polling
  convention elsewhere (`url-scraper`, `map`, `crawl`, `agentic-search`) is
  submit-then-always-poll with a `jobId`/`job_id`/`id` field present in the
  *submit* response; Wire doesn't fit that (may already be terminal, and
  only sometimes carries `job_id`), so it's handled with `client.pollUntil()`
  — a new lower-level primitive alongside `submitAndPoll()` in `src/client.ts`
  for jobs that don't fit that assumption. `anakin-ai-visibility-search`
  (keys off `search_id`, terminal on any status other than "running",
  doesn't throw on a "failed" run) and `anakin-browser-task` (keys off
  `workflow_id`, adds a `timed_out` terminal state) use the same primitive
  for the same reason.
- **Monitor secrets are redacted.** Every monitor response includes an
  `alertWebhookSecret` (an HMAC signing key). A secret that lands in an
  agent's chat transcript is compromised by definition, so all four
  `anakin-monitor-*` tools redact it before returning
  (`src/monitorShared.ts`) — get the real value from the Anakin dashboard.
- **Loosely-typed vs. strict output schemas.** `anakin-mcp/src/client.ts`
  (the source of truth this package was built against) types some responses
  precisely (`MapResult`, `CrawlResult`, `WireResolveResponse`,
  `WireJobStatus`, `AIVisibilitySearch`, `BrowserTaskResult`) and leaves
  others as bare `unknown` (Wire catalog, identities, login, build; all four
  monitor list/get/changes/control calls; AI-visibility sources; sessions).
  This package's Zod `outputSchema`s follow that split: tight schemas where
  the shape is documented, permissive `z.record(z.string(), z.unknown())` /
  `z.union([...])` passthrough where it genuinely isn't — rather than
  fabricating precise fields nobody's verified against a live response (see
  "Not done / not verified" in `SUBMIT.md`).
- **DELETE support.** The original `src/client.ts` only had `post`/`get`.
  Two endpoints need `DELETE` (`anakin-session-delete`,
  `anakin-monitor-control`'s `delete` action), so a `del()` method was added;
  everything else about the client's existing contract
  (`post`/`get`/`submitAndPoll`) is unchanged and its existing tests pass
  unmodified.

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
import { createAnakinWireDiscoverTool } from 'mastra-anakin';

const wireDiscover = createAnakinWireDiscoverTool({ apiKey: process.env.ANAKIN_API_KEY });
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

Most of these tools are asynchronous on Anakin's side: submit, then poll.
Unlike a sandboxed Pack/formula runtime with a hard execution ceiling (see
the `coda-anakin` submission's "Limitation" section for that problem), a
Mastra tool's `execute()` runs inside your own long-lived agent process, so
there's no platform-imposed time limit here. Polling uses exponential
backoff (2s initial, capped at 10s) with a 120s total budget by default —
all three configurable via `pollIntervalMs` / `pollMaxIntervalMs` /
`pollTimeoutMs` in the config object — and throws if the job fails or the
budget is exceeded (`anakin-ai-visibility-search` is the one exception: a
"failed" search still returns its partial per-source results instead of
throwing, matching Anakin's own API semantics for that endpoint).

`anakin-browser-task` runs a real cloud browser and can legitimately take
several minutes; raise `pollTimeoutMs` for it specifically if you hit the
default budget (Anakin hard-caps the underlying job at ~330s server-side
regardless).

## Test

```sh
npm test
```

## Build

```sh
npm run build
```
