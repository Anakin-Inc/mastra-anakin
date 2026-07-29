import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinWireLoginTool } from '../wireLogin.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinWireLoginTool', () => {
  it('has id anakin-wire-login, a description, and schemas', () => {
    const tool = createAnakinWireLoginTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-wire-login');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('submits POST /wire/login with catalog_slug and params', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ credential_id: 'cred_new' }));

    const tool = createAnakinWireLoginTool({ apiKey: 'test-key' });
    const result = await tool.execute!(
      { catalog_slug: 'neb', params: { email: 'a@example.com', password: 'secret' } } as any,
      {} as any,
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.anakin.io/v1/wire/login');
    expect(JSON.parse(init.body)).toEqual({
      catalog_slug: 'neb',
      params: { email: 'a@example.com', password: 'secret' },
    });
    expect(result).toEqual({ credential_id: 'cred_new' });
  });

  it('omits params/identity_name when not provided', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ credential_id: 'cred_new' }));

    const tool = createAnakinWireLoginTool({ apiKey: 'test-key' });
    await tool.execute!({ catalog_slug: 'neb' } as any, {} as any);

    const submitBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(submitBody).toEqual({ catalog_slug: 'neb' });
  });
});
