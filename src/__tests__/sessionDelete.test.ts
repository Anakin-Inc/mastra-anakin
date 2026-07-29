import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinSessionDeleteTool } from '../sessionDelete.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinSessionDeleteTool', () => {
  it('has id anakin-session-delete, a description, and schemas', () => {
    const tool = createAnakinSessionDeleteTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-session-delete');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('calls DELETE /sessions/:id', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ deleted: true }));

    const tool = createAnakinSessionDeleteTool({ apiKey: 'test-key' });
    const result = await tool.execute!({ id: 'sess_1' } as any, {} as any);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.anakin.io/v1/sessions/sess_1');
    expect(init.method).toBe('DELETE');
    expect(result).toEqual({ deleted: true });
  });
});
