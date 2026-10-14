// The README's examples, type-checked by `npm run typecheck`.
import { Agent } from '@mastra/core/agent';

import {
  createAnakinBrowserTaskTool,
  createAnakinCrawlTool,
  createAnakinReadOnlyTools,
  createAnakinSearchTool,
  createAnakinTools,
  createAnakinUrlScraperTool,
} from '@anakin-io/mastra';

export const researchAgent = new Agent({
  id: 'research-agent',
  name: 'Research Agent',
  instructions: 'Answer with facts from the web. Cite the pages you used.',
  model: 'anthropic/claude-sonnet-5',
  tools: createAnakinTools(),
});

export const readOnlyAgent = new Agent({
  id: 'read-only-agent',
  name: 'Read-only Agent',
  instructions: 'Research questions on the web. Use anakin-agentic-search for broad questions.',
  model: 'anthropic/claude-sonnet-5',
  tools: createAnakinReadOnlyTools(),
});

export const scrapeAgent = new Agent({
  id: 'scrape-agent',
  name: 'Scrape Agent',
  instructions: 'Search the web, then scrape or crawl the relevant pages.',
  model: 'anthropic/claude-sonnet-5',
  tools: {
    search: createAnakinSearchTool(),
    scrape: createAnakinUrlScraperTool(),
    crawl: createAnakinCrawlTool(),
    browserTask: createAnakinBrowserTaskTool({ pollTimeoutMs: 360_000 }),
  },
});
