import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@mastra/core/tools', () => ({
  createTool: vi.fn(config => config),
}));

import { createAnakinAiVisibilitySourcesTool } from '../aiVisibilitySources.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAnakinAiVisibilitySourcesTool', () => {
  it('has id anakin-ai-visibility-sources, a description, and schemas', () => {
    const tool = createAnakinAiVisibilitySourcesTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('anakin-ai-visibility-sources');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  it('calls GET /ai-visibility/sources', async () => {
    fetchMock.mockResolvedValueOnce(Response.json([{ slug: 'chatgpt', label: 'ChatGPT' }]));

    const tool = createAnakinAiVisibilitySourcesTool({ apiKey: 'test-key' });
    const result = await tool.execute!({} as any, {} as any);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.anakin.io/v1/ai-visibility/sources');
    expect(init.method).toBe('GET');
    expect(result).toEqual([{ slug: 'chatgpt', label: 'ChatGPT' }]);
  });
});
