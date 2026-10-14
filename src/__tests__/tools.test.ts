import { describe, it, expect, vi } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinReadOnlyTools, createAnakinTools } from '../tools.js';

const EXPECTED_IDS: Record<string, string> = {
  urlScraper: 'anakin-url-scraper',
  search: 'anakin-search',
  agenticSearch: 'anakin-agentic-search',
  map: 'anakin-map',
  crawl: 'anakin-crawl',
  wireDiscover: 'anakin-wire-discover',
  wireCatalog: 'anakin-wire-catalog',
  wireReadAction: 'anakin-wire-read-action',
  wireWriteAction: 'anakin-wire-write-action',
  wireIdentities: 'anakin-wire-identities',
  wireLogin: 'anakin-wire-login',
  wireBuild: 'anakin-wire-build',
  wireBuildStatus: 'anakin-wire-build-status',
  monitorCreate: 'anakin-monitor-create',
  monitorList: 'anakin-monitor-list',
  monitorChanges: 'anakin-monitor-changes',
  monitorControl: 'anakin-monitor-control',
  aiVisibilitySearch: 'anakin-ai-visibility-search',
  aiVisibilitySources: 'anakin-ai-visibility-sources',
  sessionList: 'anakin-session-list',
  sessionDelete: 'anakin-session-delete',
  browserTask: 'anakin-browser-task',
};

describe('createAnakinTools', () => {
  it('returns all 22 tools', () => {
    const tools = createAnakinTools({ apiKey: 'test-key' });
    expect(Object.keys(tools).sort()).toEqual(Object.keys(EXPECTED_IDS).sort());
  });

  it('creates tools with the correct ids', () => {
    const tools = createAnakinTools({ apiKey: 'test-key' }) as Record<string, { id: string }>;
    for (const [key, expectedId] of Object.entries(EXPECTED_IDS)) {
      expect(tools[key]?.id).toBe(expectedId);
    }
  });

  it('creates tools that all have descriptions and schemas', () => {
    const tools = createAnakinTools({ apiKey: 'test-key' });
    for (const tool of Object.values(tools) as Array<{
      description?: string;
      inputSchema?: unknown;
      outputSchema?: unknown;
    }>) {
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
    }
  });
});

describe('createAnakinReadOnlyTools', () => {
  it('leaves out the 7 tools that change state', () => {
    const tools = createAnakinReadOnlyTools({ apiKey: 'test-key' });
    expect(Object.keys(tools)).toHaveLength(15);
    for (const key of [
      'wireWriteAction',
      'wireLogin',
      'wireBuild',
      'monitorCreate',
      'monitorControl',
      'sessionDelete',
      'browserTask',
    ]) {
      expect(tools).not.toHaveProperty(key);
    }
  });
});
