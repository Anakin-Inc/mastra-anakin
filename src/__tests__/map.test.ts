import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinMapTool } from '../map.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinMapTool', () => {
  it('has id anakin-map, a description, and schemas', () => {
    const tool = createAnakinMapTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-map');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('submits POST /map with default field values and polls GET /map/:jobId to completion', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ jobId: 'map_1' }))
      .mockResolvedValueOnce(
        Response.json({ id: 'map_1', url: 'https://example.com', status: 'completed', links: ['https://example.com/a'], totalLinks: 1 }),
      );

    const tool = createAnakinMapTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    const result = await tool.execute!({ url: 'https://example.com' } as any, {} as any);

    const [submitUrl, submitInit] = fetchMock.mock.calls[0];
    expect(submitUrl).toBe('https://api.anakin.io/v1/map');
    expect(JSON.parse(submitInit.body)).toEqual({
      url: 'https://example.com',
      limit: 100,
      depth: 2,
      limitPerLevel: 100,
      includeSubdomains: false,
      includeExternalLinks: false,
      useBrowser: false,
    });
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.anakin.io/v1/map/map_1');
    expect(result).toMatchObject({ status: 'completed', totalLinks: 1 });
  });

  it('forwards optional fields, including the search filter', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ jobId: 'map_2' }))
      .mockResolvedValueOnce(Response.json({ id: 'map_2', url: 'https://example.com', status: 'completed', links: [], totalLinks: 0 }));

    const tool = createAnakinMapTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    await tool.execute!(
      { url: 'https://example.com', limit: 50, depth: 3, includeSubdomains: true, search: 'docs' } as any,
      {} as any,
    );

    const submitBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(submitBody).toMatchObject({ limit: 50, depth: 3, includeSubdomains: true, search: 'docs' });
  });
});
