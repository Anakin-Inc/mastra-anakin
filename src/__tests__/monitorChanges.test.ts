import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinMonitorChangesTool } from '../monitorChanges.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinMonitorChangesTool', () => {
  it('has id anakin-monitor-changes, a description, and schemas', () => {
    const tool = createAnakinMonitorChangesTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-monitor-changes');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('calls GET /monitors/:id/changes', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ changes: [{ detectedAt: '2026-01-01T00:00:00Z', summary: 'price dropped' }] }));

    const tool = createAnakinMonitorChangesTool({ apiKey: 'test-key' });
    const result = await tool.execute!({ id: 'mon_1' } as any, {} as any);

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.anakin.io/v1/monitors/mon_1/changes');
    expect(result).toEqual({ changes: [{ detectedAt: '2026-01-01T00:00:00Z', summary: 'price dropped' }] });
  });
});
