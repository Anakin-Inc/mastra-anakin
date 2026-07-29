import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinCrawlTool } from '../crawl.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinCrawlTool', () => {
  it('has id anakin-crawl, a description, and schemas', () => {
    const tool = createAnakinCrawlTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-crawl');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('submits POST /crawl with default field values and polls GET /crawl/:jobId to completion', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ jobId: 'crawl_1' }))
      .mockResolvedValueOnce(
        Response.json({
          id: 'crawl_1',
          url: 'https://example.com',
          status: 'completed',
          totalPages: 1,
          completedPages: 1,
          pages: [{ url: 'https://example.com', status: 'completed', markdown: '# hi' }],
        }),
      );

    const tool = createAnakinCrawlTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    const result = await tool.execute!({ url: 'https://example.com' } as any, {} as any);

    const submitBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(submitBody).toEqual({ url: 'https://example.com', maxPages: 10, depth: 1, country: 'us', useBrowser: false });
    expect(result).toMatchObject({ status: 'completed', totalPages: 1 });
  });

  it('forwards includePatterns/excludePatterns and session params', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ jobId: 'crawl_2' }))
      .mockResolvedValueOnce(Response.json({ id: 'crawl_2', url: 'https://example.com', status: 'completed', totalPages: 0, completedPages: 0, pages: [] }));

    const tool = createAnakinCrawlTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    await tool.execute!(
      {
        url: 'https://example.com',
        includePatterns: ['/docs/*'],
        excludePatterns: ['/blog/*'],
        sessionId: 'sess_1',
      } as any,
      {} as any,
    );

    const submitBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(submitBody).toMatchObject({ includePatterns: ['/docs/*'], excludePatterns: ['/blog/*'], sessionId: 'sess_1' });
  });
});
