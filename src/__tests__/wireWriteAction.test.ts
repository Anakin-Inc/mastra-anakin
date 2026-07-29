import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinWireWriteActionTool } from '../wireWriteAction.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinWireWriteActionTool', () => {
  it('has id anakin-wire-write-action, a description, and schemas', () => {
    const tool = createAnakinWireWriteActionTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-wire-write-action');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('submits POST /wire/task and polls to completion when a job_id is returned', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ status: 'processing', job_id: 'job_write_1' }))
      .mockResolvedValueOnce(Response.json({ status: 'completed', data: { submitted: true } }));

    const tool = createAnakinWireWriteActionTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    const result = await tool.execute!(
      { action_id: 'somesite.submit_form', params: { name: 'Ada' } } as any,
      {} as any,
    );

    const submitBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(submitBody).toEqual({ action_id: 'somesite.submit_form', params: { name: 'Ada' } });
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.anakin.io/v1/wire/jobs/job_write_1');
    expect(result).toEqual({ status: 'completed', data: { submitted: true } });
  });

  it('returns the result inline when the sync response carries no job_id', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ status: 'completed', data: { ok: true } }));

    const tool = createAnakinWireWriteActionTool({ apiKey: 'test-key' });
    const result = await tool.execute!({ action_id: 'somesite.quick_action' } as any, {} as any);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'completed', data: { ok: true } });
  });
});
