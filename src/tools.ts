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
import { createAnakinWireCatalogTool } from './wireCatalog.js';
import { createAnakinWireDiscoverTool } from './wireDiscover.js';
import { createAnakinWireIdentitiesTool } from './wireIdentities.js';
import { createAnakinWireLoginTool } from './wireLogin.js';
import { createAnakinWireReadActionTool } from './wireReadAction.js';
import { createAnakinWireWriteActionTool } from './wireWriteAction.js';

export function createAnakinTools(config?: AnakinClientOptions) {
  return {
    urlScraper: createAnakinUrlScraperTool(config),
    search: createAnakinSearchTool(config),
    agenticSearch: createAnakinAgenticSearchTool(config),
    map: createAnakinMapTool(config),
    crawl: createAnakinCrawlTool(config),
    wireDiscover: createAnakinWireDiscoverTool(config),
    wireCatalog: createAnakinWireCatalogTool(config),
    wireReadAction: createAnakinWireReadActionTool(config),
    wireWriteAction: createAnakinWireWriteActionTool(config),
    wireIdentities: createAnakinWireIdentitiesTool(config),
    wireLogin: createAnakinWireLoginTool(config),
    wireBuild: createAnakinWireBuildTool(config),
    monitorCreate: createAnakinMonitorCreateTool(config),
    monitorList: createAnakinMonitorListTool(config),
    monitorChanges: createAnakinMonitorChangesTool(config),
    monitorControl: createAnakinMonitorControlTool(config),
    aiVisibilitySearch: createAnakinAiVisibilitySearchTool(config),
    aiVisibilitySources: createAnakinAiVisibilitySourcesTool(config),
    sessionList: createAnakinSessionListTool(config),
    sessionDelete: createAnakinSessionDeleteTool(config),
    browserTask: createAnakinBrowserTaskTool(config),
  };
}
