import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinWireDiscoverTool } from '../wireDiscover.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinWireDiscoverTool', () => {
  it('has id anakin-wire-discover, a description, and schemas', () => {
    const tool = createAnakinWireDiscoverTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-wire-discover');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('calls GET /wire/resolve with q and limit as query params', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ results: [{ action_id: 'walmart.search_products' }] }));

    const tool = createAnakinWireDiscoverTool({ apiKey: 'test-key' });
    const result = await tool.execute!({ q: 'top phones on walmart', limit: 3 } as any, {} as any);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.anakin.io/v1/wire/resolve?q=top%20phones%20on%20walmart&limit=3');
    expect(init.method).toBe('GET');
    expect(result).toEqual({ results: [{ action_id: 'walmart.search_products' }] });
  });

  it('omits limit from the query string when not provided', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ results: [] }));

    const tool = createAnakinWireDiscoverTool({ apiKey: 'test-key' });
    await tool.execute!({ q: 'airbnb listings' } as any, {} as any);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.anakin.io/v1/wire/resolve?q=airbnb%20listings');
  });
});
