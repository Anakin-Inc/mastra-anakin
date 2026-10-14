# Changelog

## 0.1.0

First release, as `@anakin-io/mastra`.

- 22 Mastra tools, one per Anakin MCP server tool: scrape, search, map, crawl, agentic search,
  Wire (discover, catalog, read action, write action, identities, login, build, build status),
  monitors (create, list, changes, control), AI visibility (search, sources), browser sessions
  (list, delete) and browser tasks.
- `createAnakinTools()` returns all 22; `createAnakinReadOnlyTools()` returns the 15 that do not
  change state.
- Async jobs are polled with exponential backoff; the budget is configurable.
- Monitor webhook secrets are redacted from tool output.
