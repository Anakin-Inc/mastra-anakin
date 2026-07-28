import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({
  prompt: z.string().describe('The research prompt describing what to find and, implicitly, what to extract'),
  useBrowser: z.boolean().optional().describe('Use a headless browser during research (default true)'),
  schema: z
    .record(z.string(), z.any())
    .optional()
    .describe('Optional JSON Schema describing the structured data to extract into generatedJson.structuredData'),
});

const outputSchema = z.object({
  id: z.string(),
  status: z.enum(['completed', 'failed']),
  jobType: z.string().optional(),
  generatedJson: z
    .object({
      summary: z.string().nullable().optional(),
      structuredData: z.record(z.string(), z.any()).nullable().optional(),
      dataSchema: z.record(z.string(), z.any()).nullable().optional(),
    })
    .nullable()
    .optional(),
  cached: z.boolean().optional(),
  durationMs: z.number().optional(),
  error: z.string().nullable().optional(),
});

type AgenticSearchOutput = z.infer<typeof outputSchema>;

export function createAnakinAgenticSearchTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-agentic-search',
    description:
      'Multi-stage AI research pipeline: searches, browses, and synthesizes across multiple pages. Returns an ' +
      'AI-generated summary plus structured data matching an optional caller-supplied JSON Schema. Submits ' +
      'POST /agentic-search, then polls GET /agentic-search/:jobId until the job completes or fails. Costs 10 ' +
      'Anakin credits per call.',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const body: Record<string, unknown> = {
        prompt: input.prompt,
        useBrowser: input.useBrowser ?? true,
      };
      if (input.schema) body.schema = input.schema;

      return client.submitAndPoll('/agentic-search', '/agentic-search', body) as Promise<AgenticSearchOutput>;
    },
  });
}
