import type { AnakinClientOptions } from './client.js';
import { createAnakinAgenticSearchTool } from './agenticSearch.js';
import { createAnakinAiVisibilitySearchTool } from './aiVisibilitySearch.js';
import { createAnakinAiVisibilitySourcesTool } from './aiVisibilitySources.js';
import { createAnakinBrowserTaskTool } from './browserTask.js';
import { createAnakinCrawlTool } from './crawl.js';
import { createAnakinMapTool } from './map.js';
import { createAnakinMonitorChangesTool } from './monitorChanges.js';
import { createAnakinMonitorControlTool } from './monitorControl.js';
import { createAnakinMonitorCreateTool } from './monitorCreate.js';
import { createAnakinMonitorListTool } from './monitorList.js';
import { createAnakinSearchTool } from './search.js';
import { createAnakinSessionDeleteTool } from './sessionDelete.js';
import { createAnakinSessionListTool } from './sessionList.js';
import { createAnakinUrlScraperTool } from './urlScraper.js';
import { createAnakinWireBuildTool } from './wireBuild.js';
import { createAnakinWireBuildStatusTool } from './wireBuildStatus.js';
import { createAnakinWireCatalogTool } from './wireCatalog.js';
import { createAnakinWireDiscoverTool } from './wireDiscover.js';
import { createAnakinWireIdentitiesTool } from './wireIdentities.js';
import { createAnakinWireLoginTool } from './wireLogin.js';
import { createAnakinWireReadActionTool } from './wireReadAction.js';
import { createAnakinWireWriteActionTool } from './wireWriteAction.js';

/**
 * The 15 tools that only read data. None of them changes anything on a website
 * or in the Anakin account (no state-changing site actions, logins, builds,
 * monitor changes, deletions or browser tasks). They do spend credits.
 */
export function createAnakinReadOnlyTools(config?: AnakinClientOptions) {
  return {
    urlScraper: createAnakinUrlScraperTool(config),
    search: createAnakinSearchTool(config),
    agenticSearch: createAnakinAgenticSearchTool(config),
    map: createAnakinMapTool(config),
    crawl: createAnakinCrawlTool(config),
    wireDiscover: createAnakinWireDiscoverTool(config),
    wireCatalog: createAnakinWireCatalogTool(config),
    wireReadAction: createAnakinWireReadActionTool(config),
    wireIdentities: createAnakinWireIdentitiesTool(config),
    wireBuildStatus: createAnakinWireBuildStatusTool(config),
    monitorList: createAnakinMonitorListTool(config),
    monitorChanges: createAnakinMonitorChangesTool(config),
    aiVisibilitySearch: createAnakinAiVisibilitySearchTool(config),
    aiVisibilitySources: createAnakinAiVisibilitySourcesTool(config),
    sessionList: createAnakinSessionListTool(config),
  };
}

/** All 22 tools, including the 7 that change state on a website or in the Anakin account. */
export function createAnakinTools(config?: AnakinClientOptions) {
  return {
    ...createAnakinReadOnlyTools(config),
    wireWriteAction: createAnakinWireWriteActionTool(config),
    wireLogin: createAnakinWireLoginTool(config),
    wireBuild: createAnakinWireBuildTool(config),
    monitorCreate: createAnakinMonitorCreateTool(config),
    monitorControl: createAnakinMonitorControlTool(config),
    sessionDelete: createAnakinSessionDeleteTool(config),
    browserTask: createAnakinBrowserTaskTool(config),
  };
}
