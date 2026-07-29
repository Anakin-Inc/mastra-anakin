import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinAiVisibilitySearchTool } from '../aiVisibilitySearch.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinAiVisibilitySearchTool', () => {
  it('has id anakin-ai-visibility-search, a description, and schemas', () => {
    const tool = createAnakinAiVisibilitySearchTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-ai-visibility-search');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('submits POST /ai-visibility/search and polls GET .../search/:search_id until status is not "running"', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ search_id: 'srch_1', status: 'running', results: [] }))
      .mockResolvedValueOnce(Response.json({ search_id: 'srch_1', status: 'running', results: [] }))
      .mockResolvedValueOnce(
        Response.json({
          search_id: 'srch_1',
          status: 'completed',
          synthesis: 'They mostly agree.',
          results: [{ source: 'chatgpt', summary: 'x', full_content: 'a very long raw answer' }],
        }),
      );

    const tool = createAnakinAiVisibilitySearchTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    const result: any = await tool.execute!({ query: 'what is anakin.io' } as any, {} as any);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.anakin.io/v1/ai-visibility/search/srch_1');
    expect(result.status).toBe('completed');
    expect(result.results[0]).not.toHaveProperty('full_content');
  });

  it('includes full_content when includeFullContent is true', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ search_id: 'srch_2', status: 'running', results: [] }))
      .mockResolvedValueOnce(
        Response.json({ search_id: 'srch_2', status: 'completed', results: [{ source: 'gemini', full_content: 'raw' }] }),
      );

    const tool = createAnakinAiVisibilitySearchTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    const result: any = await tool.execute!({ query: 'x', includeFullContent: true } as any, {} as any);

    expect(result.results[0].full_content).toBe('raw');
  });

  it('does not throw when the search status is "failed" — it returns whatever results came back', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ search_id: 'srch_3', status: 'running', results: [] }))
      .mockResolvedValueOnce(
        Response.json({ search_id: 'srch_3', status: 'failed', results: [{ source: 'chatgpt', error: 'timed out' }] }),
      );

    const tool = createAnakinAiVisibilitySearchTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    const result: any = await tool.execute!({ query: 'x' } as any, {} as any);

    expect(result.status).toBe('failed');
    expect(result.results).toEqual([{ source: 'chatgpt', error: 'timed out' }]);
  });
});
