import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinBrowserTaskTool } from '../browserTask.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinBrowserTaskTool', () => {
  it('has id anakin-browser-task, a description, and schemas', () => {
    const tool = createAnakinBrowserTaskTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-browser-task');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('submits POST /ai/evaluate in async mode and polls GET /ai/jobs/:id to completion', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ workflow_id: 'wf_1', status: 'running' }))
      .mockResolvedValueOnce(Response.json({ workflow_id: 'wf_1', status: 'running' }))
      .mockResolvedValueOnce(
        Response.json({
          workflow_id: 'wf_1',
          status: 'completed',
          result: { success: true, result: { price: 19.99 }, steps: [{}, {}], run_id: 'run_1', duration_ms: 4200 },
        }),
      );

    const tool = createAnakinBrowserTaskTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    const result: any = await tool.execute!({ prompt: 'find the price' } as any, {} as any);

    const submitBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(submitBody).toEqual({ prompt: 'find the price', async: true });
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.anakin.io/v1/ai/jobs/wf_1');
    expect(result).toEqual({ success: true, result: { price: 19.99 }, stepsTaken: 2, iterations: undefined, cached: undefined, durationMs: 4200, runId: 'run_1' });
  });

  it('forwards url, sessionId, and outputSchema', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ workflow_id: 'wf_2', status: 'running' }))
      .mockResolvedValueOnce(Response.json({ workflow_id: 'wf_2', status: 'completed', result: { success: true } }));

    const tool = createAnakinBrowserTaskTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    await tool.execute!(
      {
        prompt: 'log in and check my orders',
        url: 'https://example.com',
        sessionId: 'sess_1',
        outputSchema: { type: 'object', properties: { orders: { type: 'array' } } },
      } as any,
      {} as any,
    );

    const submitBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(submitBody).toEqual({
      prompt: 'log in and check my orders',
      async: true,
      url: 'https://example.com',
      session_id: 'sess_1',
      output_schema: { type: 'object', properties: { orders: { type: 'array' } } },
    });
  });

  it('throws when the task fails', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ workflow_id: 'wf_3', status: 'running' }))
      .mockResolvedValueOnce(Response.json({ workflow_id: 'wf_3', status: 'failed', error: 'blocked by captcha' }));

    const tool = createAnakinBrowserTaskTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    await expect(tool.execute!({ prompt: 'do something' } as any, {} as any)).rejects.toThrow(/blocked by captcha/);
  });

  it('returns the response inline when the service answers synchronously (no workflow_id)', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ success: true, result: 'done immediately' }));

    const tool = createAnakinBrowserTaskTool({ apiKey: 'test-key' });
    const result: any = await tool.execute!({ prompt: 'quick task' } as any, {} as any);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.result).toBe('done immediately');
  });
});
