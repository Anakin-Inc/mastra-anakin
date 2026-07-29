import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinMonitorControlTool } from '../monitorControl.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinMonitorControlTool', () => {
  it('has id anakin-monitor-control, a description, and schemas', () => {
    const tool = createAnakinMonitorControlTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-monitor-control');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it.each([
    ['pause', 'https://api.anakin.io/v1/monitors/mon_1/pause', 'POST'],
    ['resume', 'https://api.anakin.io/v1/monitors/mon_1/resume', 'POST'],
    ['run_now', 'https://api.anakin.io/v1/monitors/mon_1/run', 'POST'],
    ['delete', 'https://api.anakin.io/v1/monitors/mon_1', 'DELETE'],
  ])('routes action %s to %s (%s)', async (action, expectedUrl, expectedMethod) => {
    fetchMock.mockResolvedValueOnce(Response.json({ id: 'mon_1' }));

    const tool = createAnakinMonitorControlTool({ apiKey: 'test-key' });
    await tool.execute!({ id: 'mon_1', action } as any, {} as any);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(expectedUrl);
    expect(init.method).toBe(expectedMethod);
  });

  it('redacts alertWebhookSecret in the response', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ id: 'mon_1', alertWebhookSecret: 'whsec_xyz' }));

    const tool = createAnakinMonitorControlTool({ apiKey: 'test-key' });
    const result: any = await tool.execute!({ id: 'mon_1', action: 'pause' } as any, {} as any);

    expect(result.alertWebhookSecret).not.toBe('whsec_xyz');
  });
});
