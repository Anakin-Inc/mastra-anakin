import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinWireBuildStatusTool } from '../wireBuildStatus.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinWireBuildStatusTool', () => {
  it('has id anakin-wire-build-status, a description, and schemas', () => {
    const tool = createAnakinWireBuildStatusTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-wire-build-status');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('fetches one build by id and drops the event log by default', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ build_request: { id: 'br 1', status: 'success' }, actions: [], events: [{ step: 1 }] }),
    );

    const tool = createAnakinWireBuildStatusTool({ apiKey: 'test-key' });
    const result = await tool.execute!({ id: 'br 1' } as any, {} as any);

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.anakin.io/v1/wire/build-requests/br%201');
    expect(fetchMock.mock.calls[0][1].method).toBe('GET');
    expect(result).toEqual({ build_request: { id: 'br 1', status: 'success' }, actions: [] });
  });

  it('keeps the event log when include_events is true', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ build_request: { id: 'br_1' }, events: [{ step: 1 }] }));

    const tool = createAnakinWireBuildStatusTool({ apiKey: 'test-key' });
    const result = await tool.execute!({ id: 'br_1', include_events: true } as any, {} as any);

    expect(result).toEqual({ build_request: { id: 'br_1' }, events: [{ step: 1 }] });
  });

  it('lists recent builds with a default limit of 10 when id is omitted', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ build_requests: [], pagination: { total: 0 } }));

    const tool = createAnakinWireBuildStatusTool({ apiKey: 'test-key' });
    await tool.execute!({ status: 'pending', page: 2 } as any, {} as any);

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.anakin.io/v1/wire/build-requests?status=pending&limit=10&page=2',
    );
  });
});
