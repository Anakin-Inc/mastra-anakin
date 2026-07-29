import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinSessionListTool } from '../sessionList.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinSessionListTool', () => {
  it('has id anakin-session-list, a description, and schemas', () => {
    const tool = createAnakinSessionListTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-session-list');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('calls GET /sessions with no query string when domain is omitted', async () => {
    fetchMock.mockResolvedValueOnce(Response.json([]));

    const tool = createAnakinSessionListTool({ apiKey: 'test-key' });
    await tool.execute!({} as any, {} as any);

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.anakin.io/v1/sessions');
  });

  it('forwards domain as a query param', async () => {
    fetchMock.mockResolvedValueOnce(Response.json([]));

    const tool = createAnakinSessionListTool({ apiKey: 'test-key' });
    await tool.execute!({ domain: 'amazon.com' } as any, {} as any);

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.anakin.io/v1/sessions?domain=amazon.com');
  });
});
