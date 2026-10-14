# @anakin-io/mastra

[Anakin](https://anakin.io) tools for [Mastra](https://mastra.ai) agents: scrape pages, map and crawl
sites, search the web, run multi-source research, use Wire's pre-built site actions, watch pages
with monitors, compare AI answer engines, and drive a cloud browser.

Each tool is a Mastra `createTool()` tool with Zod input and output schemas, so any Mastra agent
can call it. The 22 tools match the [Anakin MCP server](https://github.com/Anakin-Inc/anakin-mcp)
one to one.

This is a community package maintained by Anakin, not by the Mastra team.

## Install

```sh
npm install @anakin-io/mastra
```

Requires Node.js 22.13 or later and, as peer dependencies, `@mastra/core` 1.x and `zod` 3.25+ or 4.x
(already in any Mastra project).

Get an API key (starts with `ask_`) from the [Anakin dashboard](https://anakin.io/dashboard). There
is a free tier.

```sh
export ANAKIN_API_KEY="ask_..."
```

## Usage

```ts
import { Agent } from '@mastra/core/agent';
import { createAnakinTools } from '@anakin-io/mastra';

export const researchAgent = new Agent({
  id: 'research-agent',
  name: 'Research Agent',
  instructions: 'Answer with facts from the web. Cite the pages you used.',
  model: 'anthropic/claude-sonnet-5',
  tools: createAnakinTools(),
});
```

`createAnakinTools()` reads `ANAKIN_API_KEY` from the environment. To pass the key yourself:

```ts
createAnakinTools({ apiKey: process.env.MY_ANAKIN_KEY });
```

### Read-only agents

`createAnakinReadOnlyTools()` returns the 15 tools that only read data. It leaves out the 7 tools
marked * below, which change something on a website or in your Anakin account.

```ts
import { createAnakinReadOnlyTools } from '@anakin-io/mastra';

const tools = createAnakinReadOnlyTools();
```

### Fewer tools

A shorter tool list means a shorter prompt. Every tool has its own factory:

```ts
import { createAnakinCrawlTool, createAnakinSearchTool, createAnakinUrlScraperTool } from '@anakin-io/mastra';

const tools = {
  search: createAnakinSearchTool(),
  scrape: createAnakinUrlScraperTool(),
  crawl: createAnakinCrawlTool(),
};
```

## Tools

| Key in `createAnakinTools()` | Tool id | What it does |
| --- | --- | --- |
| **Web data** | | |
| `urlScraper` | `anakin-url-scraper` | One page as markdown, HTML, or AI-extracted JSON |
| `search` | `anakin-search` | Web search: URLs, titles and snippets, returned immediately |
| `map` | `anakin-map` | Every URL on a site, to decide what to crawl |
| `crawl` | `anakin-crawl` | Many pages of one site as markdown |
| `agenticSearch` | `anakin-agentic-search` | Research across many sources, as a summary plus structured data |
| **Wire: pre-built site actions** | | |
| `wireDiscover` | `anakin-wire-discover` | Find actions for a task, e.g. "top phones on walmart" |
| `wireCatalog` | `anakin-wire-catalog` | Every supported site, or one site's actions and their parameters |
| `wireReadAction` | `anakin-wire-read-action` | Run an action that reads data |
| `wireWriteAction` | `anakin-wire-write-action` | Run an action that changes something on the site * |
| `wireIdentities` | `anakin-wire-identities` | Your saved site logins |
| `wireLogin` | `anakin-wire-login` | Sign in to a site and get a credential * |
| `wireBuild` | `anakin-wire-build` | Request actions for a site Wire doesn't cover yet * |
| `wireBuildStatus` | `anakin-wire-build-status` | Progress of those requests |
| **Monitors** | | |
| `monitorCreate` | `anakin-monitor-create` | Watch a page, a site, or a Wire action on a schedule * |
| `monitorList` | `anakin-monitor-list` | Your monitors, or one monitor's settings |
| `monitorChanges` | `anakin-monitor-changes` | Changes a monitor detected |
| `monitorControl` | `anakin-monitor-control` | Pause, resume, run now, or delete a monitor * |
| **AI visibility** | | |
| `aiVisibilitySearch` | `anakin-ai-visibility-search` | Ask several AI answer engines the same question and compare |
| `aiVisibilitySources` | `anakin-ai-visibility-sources` | The answer engines available |
| **Browser** | | |
| `sessionList` | `anakin-session-list` | Saved browser sessions, for pages behind a login |
| `sessionDelete` | `anakin-session-delete` | Delete a saved browser session * |
| `browserTask` | `anakin-browser-task` | An AI agent that drives a real browser through a multi-step task * |

\* Changes state on a website or in your Anakin account. Left out of `createAnakinReadOnlyTools()`.
Mastra tools have no read-only or destructive annotation, so each of these says so in its
description. Only give them to agents that should be able to make those changes.

Monitor responses include an `alertWebhookSecret`. The monitor tools redact it so it never reaches
the model's context; read it from the Anakin dashboard.

## Options

Every factory takes the same optional config:

| Option | Default | What it does |
| --- | --- | --- |
| `apiKey` | `ANAKIN_API_KEY` | Your Anakin API key, sent as the `X-API-Key` header |
| `baseUrl` | `https://api.anakin.io/v1` | API base URL |
| `timeout` | `30000` | Per-request timeout, in ms |
| `pollIntervalMs` | `2000` | First delay between job status checks, in ms |
| `pollMaxIntervalMs` | `10000` | Cap on the exponential backoff between checks, in ms |
| `pollTimeoutMs` | `120000` | How long to wait for an async job before giving up, in ms |

Scrapes, maps, crawls, agentic searches, AI visibility searches, Wire jobs and browser tasks are
asynchronous on Anakin's side. The tools submit the job and poll until it finishes. A browser task
can run for several minutes, so raise `pollTimeoutMs` for it:

```ts
import { createAnakinBrowserTaskTool } from '@anakin-io/mastra';

const browserTask = createAnakinBrowserTaskTool({ pollTimeoutMs: 360_000 });
```

## Errors

A failed request throws an `Error` with the API's message (for example `Invalid or inactive API
key` for a 401). Mastra passes the message back to the model.

| Status | Meaning |
| --- | --- |
| 400 | Invalid parameters |
| 401 | Invalid API key |
| 402 | Plan upgrade required |
| 429 | Rate limit exceeded |
| 5xx | Server error, retry with backoff |

## Development

```sh
npm ci
npm run typecheck && npm run lint && npm test && npm run build
npm run smoke   # real @mastra/core, live API call if ANAKIN_API_KEY is set
```

Releases are published from GitHub Actions with npm provenance when a `v*` tag is pushed. See
[CHANGELOG.md](CHANGELOG.md).

## Links

- Install guide: [anakin.io/docs/integrations/ai-frameworks/mastra](https://anakin.io/docs/integrations/ai-frameworks/mastra)
- Anakin API reference: [anakin.io/docs/api-reference](https://anakin.io/docs/api-reference)
- Issues: [github.com/Anakin-Inc/mastra-anakin/issues](https://github.com/Anakin-Inc/mastra-anakin/issues)

## License

Apache-2.0
