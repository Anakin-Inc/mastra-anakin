import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinWireReadActionTool } from '../wireReadAction.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinWireReadActionTool', () => {
  it('has id anakin-wire-read-action, a description, and schemas', () => {
    const tool = createAnakinWireReadActionTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-wire-read-action');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('returns the result inline when the sync response carries no job_id', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ status: 'completed', data: { price: 42 } }));

    const tool = createAnakinWireReadActionTool({ apiKey: 'test-key' });
    const result = await tool.execute!({ action_id: 'walmart.get_product', params: { id: '123' } } as any, {} as any);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.anakin.io/v1/wire/task');
    expect(JSON.parse(init.body)).toEqual({ action_id: 'walmart.get_product', params: { id: '123' } });
    expect(result).toEqual({ status: 'completed', data: { price: 42 } });
  });

  it('polls GET /wire/jobs/:jobId to completion when the response carries a job_id', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ status: 'processing', job_id: 'job_wire_1' }))
      .mockResolvedValueOnce(Response.json({ status: 'processing', job_id: 'job_wire_1' }))
      .mockResolvedValueOnce(Response.json({ status: 'completed', data: { title: 'Widget' } }));

    const tool = createAnakinWireReadActionTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    const result = await tool.execute!({ action_id: 'amazon.search_products' } as any, {} as any);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.anakin.io/v1/wire/jobs/job_wire_1');
    expect(result).toEqual({ status: 'completed', data: { title: 'Widget' } });
  });

  it('throws with the error message when the wire job fails', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ status: 'processing', job_id: 'job_wire_2' }))
      .mockResolvedValueOnce(Response.json({ status: 'failed', error: { code: 'AUTH_REQUIRED', message: 'sign in first' } }));

    const tool = createAnakinWireReadActionTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    await expect(tool.execute!({ action_id: 'amazon.search_products' } as any, {} as any)).rejects.toThrow(/sign in first/);
  });

  it('forwards credential_id and identity_id when provided', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ status: 'completed', data: {} }));

    const tool = createAnakinWireReadActionTool({ apiKey: 'test-key' });
    await tool.execute!(
      { action_id: 'linkedin.get_profile', credential_id: 'cred_1', identity_id: 'ident_1' } as any,
      {} as any,
    );

    const submitBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(submitBody).toEqual({ action_id: 'linkedin.get_profile', credential_id: 'cred_1', identity_id: 'ident_1' });
  });
});
