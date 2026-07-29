import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinWireCatalogTool } from '../wireCatalog.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinWireCatalogTool', () => {
  it('has id anakin-wire-catalog, a description, and schemas', () => {
    const tool = createAnakinWireCatalogTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-wire-catalog');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('calls GET /wire/catalog when no slug is given', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ catalogs: [{ slug: 'walmart', actionCount: 12 }] }));

    const tool = createAnakinWireCatalogTool({ apiKey: 'test-key' });
    await tool.execute!({} as any, {} as any);

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.anakin.io/v1/wire/catalog');
  });

  it('calls GET /wire/catalog/:slug when a slug is given', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ slug: 'walmart', actions: [] }));

    const tool = createAnakinWireCatalogTool({ apiKey: 'test-key' });
    await tool.execute!({ slug: 'walmart' } as any, {} as any);

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.anakin.io/v1/wire/catalog/walmart');
  });
});
