# Mastra — submission notes

Unlike Dagster (PR to `dagster-io/community-integrations`) or Coda (a
CLI-published Pack, listed via the Pack Studio UI), Mastra has **no
documented self-serve process for third-party tool packages**. That's the
central finding of this submission, not an oversight — see "Real
distribution path" below.

## What's here

```
src/client.ts            getAnakinClient() — shared fetch wrapper: X-API-Key header, submitAndPoll() helper
src/urlScraper.ts         createAnakinUrlScraperTool()
src/search.ts              createAnakinSearchTool()
src/agenticSearch.ts       createAnakinAgenticSearchTool()
src/tools.ts                createAnakinTools() — bundles all three
src/index.ts                 public exports
src/__tests__/*.test.ts       vitest, 21 tests, mocks fetch and @mastra/core/tools
package.json, tsconfig.json, tsup.config.ts
```

This picks up a prior in-session attempt that had already written all of the
above and run a build once (a `dist/` existed) but stalled before writing
README.md/SUBMIT.md or re-confirming its own claims. Everything below was
re-verified directly in this pass, not trusted from that attempt's report.

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

- **`npx tsc --noEmit`** — clean, zero errors. Re-run directly in this pass
  (not trusted from the prior attempt's claim).
- **`npx vitest run`** — 21/21 tests pass across 5 test files (`client`,
  `urlScraper`, `search`, `agenticSearch`, `tools`), ~300ms total.
- **`npx tsup`** — real rebuild (deleted the prior attempt's `dist/` and
  rebuilt from scratch): ESM + CJS + `.d.ts`/`.d.cts` output, succeeds in
  under 2 seconds.
- None of the above hung or came close to the ~2 minute budget.
  `node_modules` was already installed from the prior attempt (280 packages
  present — `vitest`, `tsup`, `@mastra/core`, `zod` all resolve); a fresh
  `npm install` was not re-run since it wasn't needed to verify
  typecheck/test/build, and re-running it risked repeating whatever caused
  the prior attempt's 10-minute stall. Everything that *was* run this pass
  completed fast and cleanly — the prior stall, whatever its cause, was not
  in `tsc`/`vitest`/`tsup`.

## Not done / not verified

- No live call against the real `api.anakin.io` API (unlike the Coda
  submission, which got a real 401 round-trip confirming endpoint paths and
  headers). Request/response shapes were built by reading `anakin-py`'s
  `client.py`/`models.py` field names directly (mapping below), not observed
  from a live response.
- `npm publish` never run — no npm account/token in this environment, and
  per the standing autonomy rules this needs the account owner regardless.
- `tsai-registry.dev`'s actual submission mechanics unconfirmed.
- Whether Anakin's real job latency for `url-scraper`/`agentic-search`
  routinely fits under the default 120s poll budget in `client.ts` is
  unverified — no live jobs were run. If real p95 latency exceeds that, the
  fix is raising `pollTimeoutMs` (a caller-supplied config value, not a hard
  limit), which is a materially easier fix than Coda's ~60s hard ceiling.

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
