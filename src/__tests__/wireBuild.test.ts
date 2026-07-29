import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinWireBuildTool } from '../wireBuild.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinWireBuildTool', () => {
  it('has id anakin-wire-build, a description, and schemas', () => {
    const tool = createAnakinWireBuildTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-wire-build');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('submits POST /wire/build-request with website_url and goal', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ status: 'pending', build_id: 'build_1' }));

    const tool = createAnakinWireBuildTool({ apiKey: 'test-key' });
    const result = await tool.execute!(
      { website_url: 'https://newsite.example.com', goal: 'extract product prices' } as any,
      {} as any,
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.anakin.io/v1/wire/build-request');
    expect(JSON.parse(init.body)).toEqual({
      website_url: 'https://newsite.example.com',
      goal: 'extract product prices',
    });
    expect(result).toEqual({ status: 'pending', build_id: 'build_1' });
  });

  it('forwards visibility and force when provided', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ status: 'pending' }));

    const tool = createAnakinWireBuildTool({ apiKey: 'test-key' });
    await tool.execute!(
      { website_url: 'https://newsite.example.com', goal: 'extract prices', visibility: 'public', force: true } as any,
      {} as any,
    );

    const submitBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(submitBody).toMatchObject({ visibility: 'public', force: true });
  });
});
