import type { AnakinClientOptions } from './client.js';
import { createAnakinAgenticSearchTool } from './agenticSearch.js';
import { createAnakinSearchTool } from './search.js';
import { createAnakinUrlScraperTool } from './urlScraper.js';

export function createAnakinTools(config?: AnakinClientOptions) {
  return {
    urlScraper: createAnakinUrlScraperTool(config),
    search: createAnakinSearchTool(config),
    agenticSearch: createAnakinAgenticSearchTool(config),
  };
}
