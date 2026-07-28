import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinUrlScraperTool } from '../urlScraper.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinUrlScraperTool', () => {
  it('has id anakin-url-scraper, a description, and schemas', () => {
    const tool = createAnakinUrlScraperTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-url-scraper');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('submits with default field values and polls to completion', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ jobId: 'job_1' }))
      .mockResolvedValueOnce(Response.json({ id: 'job_1', url: 'https://example.com', status: 'completed', markdown: '# hi' }));

    const tool = createAnakinUrlScraperTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    const result = await tool.execute!({ url: 'https://example.com' } as any, {} as any);

    const submitBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(submitBody).toEqual({
      url: 'https://example.com',
      country: 'us',
      useBrowser: false,
      generateJson: false,
      forceFresh: false,
    });
    expect(result).toEqual({ id: 'job_1', url: 'https://example.com', status: 'completed', markdown: '# hi' });
  });

  it('forwards optional fields, including session params, when provided', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ jobId: 'job_2' }))
      .mockResolvedValueOnce(Response.json({ id: 'job_2', url: 'https://example.com', status: 'completed' }));

    const tool = createAnakinUrlScraperTool({ apiKey: 'test-key', pollIntervalMs: 1 });
    await tool.execute!(
      {
        url: 'https://example.com',
        country: 'gb',
        useBrowser: true,
        generateJson: true,
        forceFresh: true,
        sessionId: 'sess_1',
        sessionName: 'my-session',
      } as any,
      {} as any,
    );

    const submitBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(submitBody).toEqual({
      url: 'https://example.com',
      country: 'gb',
      useBrowser: true,
      generateJson: true,
      forceFresh: true,
      sessionId: 'sess_1',
      sessionName: 'my-session',
    });
  });
});
