import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinWireIdentitiesTool } from '../wireIdentities.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinWireIdentitiesTool', () => {
  it('has id anakin-wire-identities, a description, and schemas', () => {
    const tool = createAnakinWireIdentitiesTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-wire-identities');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('calls GET /wire/identities with no query string when catalog_id is omitted', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ identities: [] }));

    const tool = createAnakinWireIdentitiesTool({ apiKey: 'test-key' });
    await tool.execute!({} as any, {} as any);

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.anakin.io/v1/wire/identities');
  });

  it('forwards catalog_id as a query param', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ identities: [] }));

    const tool = createAnakinWireIdentitiesTool({ apiKey: 'test-key' });
    await tool.execute!({ catalog_id: 'walmart' } as any, {} as any);

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.anakin.io/v1/wire/identities?catalog_id=walmart');
  });
});
