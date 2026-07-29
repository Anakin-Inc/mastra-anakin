# Mastra — submission notes

Unlike Dagster (PR to `dagster-io/community-integrations`) or Coda (a
CLI-published Pack, listed via the Pack Studio UI), Mastra has **no
documented self-serve process for third-party tool packages**. That's the
central finding of this submission, not an oversight — see "Real
distribution path" below.

## What's here

```
src/client.ts                 getAnakinClient() — shared fetch wrapper: X-API-Key header,
                               submitAndPoll() + pollUntil() helpers, withQuery(), del()
src/urlScraper.ts              createAnakinUrlScraperTool()
src/search.ts                   createAnakinSearchTool()
src/agenticSearch.ts            createAnakinAgenticSearchTool()
src/map.ts                       createAnakinMapTool()
src/crawl.ts                      createAnakinCrawlTool()
src/wireDiscover.ts                createAnakinWireDiscoverTool()
src/wireCatalog.ts                  createAnakinWireCatalogTool()
src/wireActionShared.ts              shared input/output schema + POST /wire/task execution
src/wireReadAction.ts                 createAnakinWireReadActionTool()
src/wireWriteAction.ts                 createAnakinWireWriteActionTool()
src/wireIdentities.ts                   createAnakinWireIdentitiesTool()
src/wireLogin.ts                         createAnakinWireLoginTool()
src/wireBuild.ts                          createAnakinWireBuildTool()
src/monitorShared.ts                       redactSecrets() — strips alertWebhookSecret
src/monitorCreate.ts                        createAnakinMonitorCreateTool()
src/monitorList.ts                           createAnakinMonitorListTool()
src/monitorChanges.ts                         createAnakinMonitorChangesTool()
src/monitorControl.ts                          createAnakinMonitorControlTool()
src/aiVisibilitySearch.ts                       createAnakinAiVisibilitySearchTool()
src/aiVisibilitySources.ts                       createAnakinAiVisibilitySourcesTool()
src/sessionList.ts                                createAnakinSessionListTool()
src/sessionDelete.ts                               createAnakinSessionDeleteTool()
src/browserTask.ts                                  createAnakinBrowserTaskTool()
src/tools.ts                                         createAnakinTools() — bundles all 21
src/index.ts                                          public exports
src/__tests__/*.test.ts                                vitest, 80 tests across 23 files,
                                                        mocks fetch and @mastra/core/tools
package.json, tsconfig.json, tsup.config.ts
```

This picks up a prior in-session attempt that had already written the first
3 tools (`urlScraper`/`search`/`agenticSearch`) and run a build once (a
`dist/` existed) but stalled before writing README.md/SUBMIT.md or
re-confirming its own claims — see "Coverage: 21 of 21 endpoints" below for
what this pass added on top of that. Everything under "Verified in this
pass" was re-verified directly, not trusted from that attempt's report.

## Coverage: 21 of 21 Anakin endpoints

Every endpoint documented in `anakin-mcp/src/client.ts` (the ground-truth
Anakin API client this session's other integrations were built against) now
has a `createTool()` wrapper — see the table in `README.md`. All 21 fit
Mastra's `createTool()` model as either a single request or a submit-then-poll
job; none were excluded. Three things needed genuine (backward-compatible)
extension of `src/client.ts` to support the newer tools honestly rather than
forcing them through the original `submitAndPoll()`, which was built only
for the scrape/agentic-search shape (submit response carries
`jobId`/`job_id`/`id`, poll the same path prefix, terminal on
completed/failed):

1. **`pollUntil(path, isDone)`** — a lower-level poller (the same
   exponential-backoff loop `submitAndPoll` now delegates to internally) for
   jobs whose id field or terminal condition differs: Wire tasks
   (`job_id`, may finish inline with no id at all), AI Visibility searches
   (`search_id`, terminal on anything but "running", doesn't throw on
   "failed"), browser tasks (`workflow_id`, extra `timed_out` terminal
   state).
2. **`del(path)`** — the original client only had `post`/`get`;
   `anakin-session-delete` and `anakin-monitor-control`'s `delete` action
   both need a real `DELETE` request.
3. **`withQuery(path, params)`** — a small query-string builder (mirrors
   `anakin-mcp/src/client.ts`'s own helper of the same name) for the several
   `GET` endpoints that take query params (`wire/resolve`, `wire/identities`,
   `sessions`).

`src/__tests__/client.test.ts`'s existing `submitAndPoll` tests and the
`post`/`get` tests all still pass unmodified against the refactored client —
the public contract (`post`, `get`, `submitAndPoll`) didn't change behavior,
only grew.

## Real Mastra structure confirmed, not assumed

- `createTool()` from `@mastra/core/tools`, with `id`, `description`, Zod
  `inputSchema`/`outputSchema`, and an `execute` function, is the current
  documented pattern — confirmed live against `mastra.ai/docs/tools-mcp/overview`
  and `mastra.ai/reference/tools/create-tool`. No deprecated `Integration`
  class pattern appears anywhere in current docs; the concern flagged in the
  task brief didn't pan out — there's no legacy pattern being worked around,
  `createTool()` is simply the only one documented today.
- Mastra's own real integration packages (`brightdata`, `livekit`,
  `opencode`, `perplexity`, `tavily` — confirmed via the `integrations/`
  directory in `github.com/mastra-ai/mastra`) publish as `@mastra/<name>`
  (e.g. `@mastra/tavily`, itself built on `createTool()` per its package
  description). That scope is **not** open to third parties:
  `CONTRIBUTING.md` in the same repo covers bugs/PRs/docs but has no section
  on adding a new integration, and the real third-party Mastra tool packages
  found on npm scope under their *own* org instead — `@composio/mastra`,
  `@caleblawson/mastra` — never `@mastra/*`. A 2026 supply-chain incident
  (140+ `@mastra/*`-scoped packages compromised via a forgotten contributor
  account, covered by Snyk and Aikido) further confirms that scope is a
  tightly held, actively-controlled namespace, not one a third party could
  self-publish into.
- Given that, this package was originally scaffolded as `@mastra/anakin`
  (implying official/first-party status) — **corrected in this pass** to the
  unscoped `mastra-anakin`, matching the naming convention already used for
  `dagster-anakin`/`coda-anakin` this session, and no longer falsely implying
  Mastra-org ownership. `package.json`'s `repository`/`bugs`/`homepage` were
  corrected the same way, from a fabricated `mastra-ai/mastra` monorepo path
  to `Anakin-Inc/mastra-anakin` (an own-repo, matching `coda-anakin`'s
  `package.json` precedent).
- A community-run catalog, `tsai-registry.dev` ("an open catalog of Mastra
  agents, workflows, and tools"), exists as a secondary listing target — not
  investigated in depth; its submission mechanics (a GitHub repo is
  referenced, but the exact PR/form process wasn't confirmed) remain
  unverified. Flagging it the way `haystack/` and `langflow/` are flagged in
  the parent `directory-submissions/README.md`: a plausible but unverified
  lead, not a confirmed path.

## Real distribution path

There is no directory to submit this package *into*, the way there is for
Dagster or Coda. The real, self-serve path is: publish `mastra-anakin` to the
public npm registry; any Mastra user installs it directly
(`npm install mastra-anakin`) and imports `createAnakinTools` /
`createAnakinSearchTool` / etc. the same way they'd import any other tool
package into their agent's `tools`. That npm publish is the entire
"submission" — there's no review, gallery listing, or PR step analogous to
Dagster/Coda for this platform today.

## Verified in this pass, not assumed

- **`npx tsc --noEmit`** — clean, zero errors, both before this pass's
  changes (baseline re-confirmed) and after all 18 new tools + the
  `client.ts` extension landed.
- **`npx vitest run`** — 80/80 tests pass across 23 test files (the original
  5 — `client`, `urlScraper`, `search`, `agenticSearch`, `tools` — plus one
  new file per added tool), ~500ms total.
- **`npx tsup`** — real rebuild: ESM + CJS + `.d.ts`/`.d.cts` output,
  succeeds in ~1.3s (`dist/index.js` 46.7KB, `dist/index.cjs` 48.8KB,
  `dist/index.d.ts` 25.5KB).
- None of the above hung or came close to the ~2 minute budget.
  `node_modules` was already installed from the prior attempt (280 packages
  present — `vitest`, `tsup`, `@mastra/core`, `zod` all resolve); a fresh
  `npm install` was not re-run since it wasn't needed to verify
  typecheck/test/build. Everything run this pass completed fast and cleanly.
- Every new tool's execute path is covered by a test that mocks `fetch` and
  asserts the real request shape (method, URL, body) sent to
  `api.anakin.io` — not just that the tool object has an id/description.
  This caught one real bug during development: `anakin-browser-task`'s sync
  (no-`workflow_id`) fallback path was initially unwrapping `.result` off
  the raw response the same way the polled/async path does, which is wrong
  — the sync response *is* the `BrowserTaskResult` already, not a job
  envelope wrapping one. Fixed and covered by a regression test
  (`browserTask.test.ts`, "returns the response inline when the service
  answers synchronously").

## Not done / not verified

- No live call against the real `api.anakin.io` API (unlike the Coda
  submission, which got a real 401 round-trip confirming endpoint paths and
  headers). Request/response shapes for `urlScraper`/`search`/`agenticSearch`
  were built by reading `anakin-py`'s `client.py`/`models.py` field names
  directly; request shapes and endpoint paths for the 18 tools added this
  pass were built by reading `anakin-mcp/src/client.ts` and
  `anakin-mcp/src/tools/*.ts` directly (the task's specified ground truth).
  None of it was observed from a live response — see "loosely-typed vs.
  strict output schemas" in `README.md` for how that shaped which
  `outputSchema`s are precise vs. deliberately permissive.
- `npm publish` never run — no npm account/token in this environment, and
  per the standing autonomy rules this needs the account owner regardless.
- `tsai-registry.dev`'s actual submission mechanics unconfirmed.
- Whether Anakin's real job latency for any of the async tools routinely
  fits under the default 120s poll budget in `client.ts` is unverified — no
  live jobs were run. If real p95 latency exceeds that, the fix is raising
  `pollTimeoutMs` (a caller-supplied config value, not a hard limit), which
  is a materially easier fix than Coda's ~60s hard ceiling. `browser_task` in
  particular is documented server-side as running up to ~330s, comfortably
  past the 120s default — callers doing browser-automation work should raise
  `pollTimeoutMs` accordingly (called out in README's Polling section).
- Wire's `wire_read_action`/`wire_write_action` do not replicate
  `anakin-mcp`'s `authGuidance()` behavior (turning `AUTH_REQUIRED` /
  `AUTH_EXPIRED` / `FORBIDDEN` errors into actionable next-step text with a
  `connect_url`). This package's `client.ts` is deliberately minimal (plain
  `Error` with a parsed message, no structured `AnakinError` with
  `code`/`details` the way `anakin-mcp/src/client.ts` has) — reproducing
  that guidance would mean adding a structured error type to the shared
  client for one tool family's benefit. Left as a follow-up if Wire error
  handling turns out to matter in practice; the underlying error's message
  still surfaces via a plain thrown `Error`.
- Wire write actions / `wire_build` / `browser_task` do not replicate
  `anakin-mcp`'s Connectors-Directory-specific `financialBlockReason()`
  policy filter (refusing payment/fund-transfer instructions). That policy
  exists because Anthropic's Connectors Directory requires it for MCP
  servers; it isn't a documented Mastra or npm-package requirement, so it
  wasn't carried over — each such tool's description does flag the
  destructive/side-effecting nature of the call instead, so the calling
  agent/human is expected to gate it.

## Field-by-field shape source

Response schemas in `urlScraper.ts` / `search.ts` / `agenticSearch.ts` mirror
`anakin-py/src/anakin/models.py`'s `Document`, `SearchResult`, and
`AgenticSearchResult` field-for-field (using the camelCase wire names
directly — Mastra's Zod schemas don't need the snake_case aliasing Pydantic
does on the Python side). The submit/poll request bodies mirror
`anakin-py/src/anakin/client.py`'s `scrape()`, `search()`, and
`agentic_search()` methods, including the exact default values
(`country="us"`, `useBrowser=False`, `generateJson=False`,
`forceFresh=False` for scrape; `limit=5` for search; `useBrowser=True` for
agentic search) and the job-id fallback chain (`jobId` / `job_id` / `id`) and
terminal-status check (`status in {"completed", "failed"}`) both source
files use.

The 18 tools added this pass (`map`, `crawl`, and the Wire/monitor/AI
visibility/session/browser-task families) mirror `anakin-mcp/src/client.ts`
directly instead: its exported interfaces (`MapOptions`/`MapResult`,
`CrawlOptions`/`CrawlResult`, `WireRunOptions`/`WireJobStatus`,
`WireResolveResponse`, `WireLoginRequest`, `WireBuildRequest`,
`MonitorCreateOptions`, `AIVisibilitySearchOptions`/`AIVisibilitySearch`,
`BrowserTaskOptions`/`BrowserTaskResult`) for field names and defaults, and
its method bodies (`map()`, `crawl()`, `wireResolve()`, `wireCatalog()`,
`wireRun()`/`pollWireJob()`, `wireIdentities()`, `wireLogin()`, `wireBuild()`,
`monitorCreate()`/`monitorList()`/`monitorGet()`/`monitorChanges()`/
`monitorControl()`, `aiVisibilitySearch()`, `aiVisibilitySources()`,
`sessionsList()`/`sessionDelete()`, `browserTask()`) for endpoint paths,
default values, and the exact submit/poll/terminal-state shape each endpoint
uses (documented per-tool in this pass's `client.ts` extension and echoed in
each tool file's `description`).

## On "5 packages, curated"

Whatever curation limit that premise implied, it's stale by the time of this
submission: `directory-submissions/` already holds 20+ platform folders from
this session alone (dagster, coda, fivetran, hasura, camunda, github-app,
intercom, zendesk, google-workspace, excel, power-platform, tray, kubeflow,
looker-actions, looker-studio, aws-marketplace, rapidapi, v0-vercel, appian,
crewai-tools, and now mastra) — not a curated shortlist of five. Treat that
number as outdated; the scope this session actually settled into is "as many
real, source-verified integration surfaces as can be built and checked," not
a fixed count.

## Steps (needs the account owner)

1. `npm publish` from this directory — needs a real npm account with publish
   rights to the (currently unclaimed, unverified) `mastra-anakin` package
   name.
2. Optionally propose it as an official `@mastra/anakin` integration by
   opening an issue/discussion with the Mastra team directly — no documented
   self-serve process exists for this; per the real `CONTRIBUTING.md`, it
   would need direct contact, not a PR.
3. Optionally list on `tsai-registry.dev` once its real submission mechanics
   are confirmed.
