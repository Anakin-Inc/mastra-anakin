import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinAgenticSearchTool } from '../agenticSearch.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinAgenticSearchTool', () => {
  it('has id anakin-agentic-search, a description, and schemas', () => {
    const tool = createAnakinAgenticSearchTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-agentic-search');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('submits with useBrowser defaulting to true and polls to completion', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ jobId: 'job_9' }))
      .mockResolvedValueOnce(
        Response.json({
          id: 'job_9',
          status: 'completed',
          jobType: 'agentic_search',
          generatedJson: { summary: 'done', structuredData: { foo: 'bar' } },
        }),
      );

    const tool = createAnakinAgenticSearchTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    const result = await tool.execute!({ prompt: 'research this' } as any, {} as any);

    const submitBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(submitBody).toEqual({ prompt: 'research this', useBrowser: true });
    expect(result).toMatchObject({ status: 'completed', generatedJson: { summary: 'done' } });
  });

  it('forwards useBrowser: false and an explicit schema', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ jobId: 'job_10' }))
      .mockResolvedValueOnce(Response.json({ id: 'job_10', status: 'completed' }));

    const schema = { type: 'object', properties: { price: { type: 'number' } } };
    const tool = createAnakinAgenticSearchTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    await tool.execute!({ prompt: 'find the price', useBrowser: false, schema } as any, {} as any);

    const submitBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(submitBody).toEqual({ prompt: 'find the price', useBrowser: false, schema });
  });

  it('throws when the job fails', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ jobId: 'job_11' }))
      .mockResolvedValueOnce(Response.json({ id: 'job_11', status: 'failed', error: 'no results found' }));

    const tool = createAnakinAgenticSearchTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    await expect(tool.execute!({ prompt: 'research this' } as any, {} as any)).rejects.toThrow(/no results found/);
  });
});
