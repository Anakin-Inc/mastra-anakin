import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinMonitorCreateTool } from '../monitorCreate.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinMonitorCreateTool', () => {
  it('has id anakin-monitor-create, a description, and schemas', () => {
    const tool = createAnakinMonitorCreateTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-monitor-create');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('submits POST /monitors with only url and intervalMinutes when no options are set', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ id: 'mon_1', url: 'https://example.com', intervalMinutes: 30 }));

    const tool = createAnakinMonitorCreateTool({ apiKey: 'test-key' });
    const result = await tool.execute!({ url: 'https://example.com', intervalMinutes: 30 } as any, {} as any);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.anakin.io/v1/monitors');
    expect(JSON.parse(init.body)).toEqual({ url: 'https://example.com', intervalMinutes: 30 });
    expect(result).toMatchObject({ id: 'mon_1' });
  });

  it('forwards optional fields when set', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ id: 'mon_2' }));

    const tool = createAnakinMonitorCreateTool({ apiKey: 'test-key' });
    await tool.execute!(
      {
        url: 'https://example.com/product',
        intervalMinutes: 60,
        scope: 'page',
        watchMode: 'specific_data',
        outputSchema: { type: 'object', properties: { price: { type: 'number' } } },
        aiMode: true,
      } as any,
      {} as any,
    );

    const submitBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(submitBody).toMatchObject({
      scope: 'page',
      watchMode: 'specific_data',
      outputSchema: { type: 'object', properties: { price: { type: 'number' } } },
      aiMode: true,
    });
  });

  it('redacts alertWebhookSecret in the response', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ id: 'mon_3', alertWebhookUrl: 'https://hooks.example.com', alertWebhookSecret: 'whsec_super_secret' }),
    );

    const tool = createAnakinMonitorCreateTool({ apiKey: 'test-key' });
    const result: any = await tool.execute!({ url: 'https://example.com', intervalMinutes: 30 } as any, {} as any);

    expect(result.alertWebhookSecret).not.toBe('whsec_super_secret');
    expect(result.alertWebhookSecret).toMatch(/redacted/);
  });
});
