import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinSearchTool } from '../search.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinSearchTool', () => {
  it('has id anakin-search, a description, and schemas', () => {
    const tool = createAnakinSearchTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-search');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('is synchronous — a single POST /search call, no polling', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        id: 'search_1',
        results: [{ url: 'https://example.com', title: 'Example', snippet: 'An example site' }],
      }),
    );

    const tool = createAnakinSearchTool({ apiKey: 'test-key' });
    const result = await tool.execute!({ prompt: 'test query' } as any, {} as any);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.anakin.io/v1/search');
    expect(JSON.parse(init.body)).toEqual({ prompt: 'test query', limit: 5 });
    expect(result).toEqual({
      id: 'search_1',
      results: [{ url: 'https://example.com', title: 'Example', snippet: 'An example site' }],
    });
  });

  it('forwards an explicit limit', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ id: 'search_2', results: [] }));

    const tool = createAnakinSearchTool({ apiKey: 'test-key' });
    await tool.execute!({ prompt: 'test query', limit: 10 } as any, {} as any);

    const init = fetchMock.mock.calls[0][1];
    expect(JSON.parse(init.body)).toEqual({ prompt: 'test query', limit: 10 });
  });
});
