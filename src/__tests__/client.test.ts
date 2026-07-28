import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { getAnakinClient } from '../client.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getAnakinClient', () => {
  it('throws when no API key is available', () => {
    const originalEnv = process.env.ANAKIN_API_KEY;
    delete process.env.ANAKIN_API_KEY;

    expect(() => getAnakinClient()).toThrow(/Anakin API key is required/);

    if (originalEnv !== undefined) process.env.ANAKIN_API_KEY = originalEnv;
  });

  it('sends X-API-Key header and JSON body against the default base URL on post()', async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 'search_123', results: [] }));

    const client = getAnakinClient({ apiKey: 'ak-test' });
    await client.post('/search', { prompt: 'test query', limit: 5 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.anakin.io/v1/search');
    expect(init.method).toBe('POST');
    expect(init.headers['X-API-Key']).toBe('ak-test');
    expect(JSON.parse(init.body)).toEqual({ prompt: 'test query', limit: 5 });
  });

  it('get() issues a GET with no body', async () => {
    fetchMock.mockResolvedValue(Response.json({ status: 'completed' }));

    const client = getAnakinClient({ apiKey: 'ak-test' });
    await client.get('/url-scraper/job_123');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.anakin.io/v1/url-scraper/job_123');
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
  });

  it('throws a clear error on a non-OK response', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'unauthorized', message: 'Invalid or inactive API key' }), {
        status: 401,
      }),
    );

    const client = getAnakinClient({ apiKey: 'bad-key' });
    await expect(client.post('/search', { prompt: 'x' })).rejects.toThrow(/Invalid or inactive API key/);
  });

  describe('submitAndPoll', () => {
    it('submits then polls until status is completed', async () => {
      fetchMock
        .mockResolvedValueOnce(Response.json({ jobId: 'job_abc' }))
        .mockResolvedValueOnce(Response.json({ id: 'job_abc', status: 'processing' }))
        .mockResolvedValueOnce(Response.json({ id: 'job_abc', status: 'completed', markdown: '# hi' }));

      const client = getAnakinClient({ apiKey: 'ak-test', pollIntervalMs: 1 });
      const result = await client.submitAndPoll('/url-scraper', '/url-scraper', { url: 'https://example.com' });

      expect(result).toEqual({ id: 'job_abc', status: 'completed', markdown: '# hi' });
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(fetchMock.mock.calls[1][0]).toBe('https://api.anakin.io/v1/url-scraper/job_abc');
    });

    it('throws when the job reaches a failed status', async () => {
      fetchMock
        .mockResolvedValueOnce(Response.json({ jobId: 'job_bad' }))
        .mockResolvedValueOnce(Response.json({ id: 'job_bad', status: 'failed', error: 'blocked by target site' }));

      const client = getAnakinClient({ apiKey: 'ak-test', pollIntervalMs: 1 });
      await expect(
        client.submitAndPoll('/url-scraper', '/url-scraper', { url: 'https://example.com' }),
      ).rejects.toThrow(/blocked by target site/);
    });

    it('throws when the submit response has no job id', async () => {
      fetchMock.mockResolvedValueOnce(Response.json({ status: 'ok' }));

      const client = getAnakinClient({ apiKey: 'ak-test' });
      await expect(client.submitAndPoll('/url-scraper', '/url-scraper', { url: 'https://example.com' })).rejects.toThrow(
        /did not include a job id/,
      );
    });
  });
});
