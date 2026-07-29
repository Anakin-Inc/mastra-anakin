import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinMonitorListTool } from '../monitorList.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinMonitorListTool', () => {
  it('has id anakin-monitor-list, a description, and schemas', () => {
    const tool = createAnakinMonitorListTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-monitor-list');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('calls GET /monitors when no id is given', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ monitors: [] }));

    const tool = createAnakinMonitorListTool({ apiKey: 'test-key' });
    await tool.execute!({} as any, {} as any);

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.anakin.io/v1/monitors');
  });

  it('calls GET /monitors/:id when an id is given, and redacts the secret', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ id: 'mon_1', alertWebhookSecret: 'whsec_abc' }));

    const tool = createAnakinMonitorListTool({ apiKey: 'test-key' });
    const result: any = await tool.execute!({ id: 'mon_1' } as any, {} as any);

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.anakin.io/v1/monitors/mon_1');
    expect(result.alertWebhookSecret).not.toBe('whsec_abc');
  });
});
