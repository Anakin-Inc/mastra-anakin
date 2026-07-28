import { describe, it, expect, vi } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinTools } from '../tools.js';

describe('createAnakinTools', () => {
  it('should return all three tools', () => {
    const tools = createAnakinTools({ apiKey: 'test-key' });

    expect(tools.urlScraper).toBeDefined();
    expect(tools.search).toBeDefined();
    expect(tools.agenticSearch).toBeDefined();
  });

  it('should create tools with correct ids', () => {
    const tools = createAnakinTools({ apiKey: 'test-key' });

    expect(tools.urlScraper.id).toBe('anakin-url-scraper');
    expect(tools.search.id).toBe('anakin-search');
    expect(tools.agenticSearch.id).toBe('anakin-agentic-search');
  });

  it('should create tools that all have descriptions', () => {
    const tools = createAnakinTools({ apiKey: 'test-key' });

    expect(tools.urlScraper.description).toBeTruthy();
    expect(tools.search.description).toBeTruthy();
    expect(tools.agenticSearch.description).toBeTruthy();
  });

  it('should create tools that all have input and output schemas', () => {
    const tools = createAnakinTools({ apiKey: 'test-key' });

    for (const tool of Object.values(tools)) {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
    }
  });
});
