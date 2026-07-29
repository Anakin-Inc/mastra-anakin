import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAnakinClient } from './client.js';
import type { AnakinClientOptions } from './client.js';

const inputSchema = z.object({
  prompt: z
    .string()
    .describe(
      'The task in natural language. Be specific about the goal and what to return. Never include passwords or ' +
        'secrets — use sessionId for authenticated sites.',
    ),
  url: z.string().optional().describe('Navigate here before starting. Omit to let the agent follow URLs named in the prompt.'),
  sessionId: z.string().optional().describe('Saved browser-session ID (from anakin-session-list) so the task runs logged in'),
  maxSteps: z.number().int().min(1).optional().describe('Cap on agent steps (navigation/click/type actions)'),
  timeoutMs: z.number().int().min(1000).optional().describe('Task timeout in milliseconds (server caps runs at ~330s regardless)'),
  outputSchema: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('JSON Schema for the result — the agent returns structured data conforming to it'),
});

const outputSchema = z.object({
  success: z.boolean().optional(),
  result: z.unknown().optional(),
  stepsTaken: z.number().optional(),
  iterations: z.number().optional(),
  cached: z.boolean().optional(),
  durationMs: z.number().optional(),
  runId: z.string().optional(),
});

type BrowserTaskOutput = z.infer<typeof outputSchema>;

export function createAnakinBrowserTaskTool(config?: AnakinClientOptions) {
  return createTool({
    id: 'anakin-browser-task',
    description:
      'Run a natural-language task in a real cloud browser driven by an AI agent: it navigates, clicks, types, ' +
      'scrolls, and extracts on your behalf ("find the cheapest 65-inch TV on this site and list its specs", ' +
      '"fill the contact form with …"). Use when anakin-url-scraper cannot do the job (multi-step flows, ' +
      'interactions, complex navigation) and no Wire action covers the site (check anakin-wire-discover first — ' +
      'Wire actions are faster and cheaper). Submits POST /ai/evaluate in async mode, then polls GET ' +
      '/ai/jobs/:id — runs up to ~5.5 minutes server-side. For login-protected tasks pass sessionId from ' +
      'anakin-session-list — never put passwords in the prompt. Supply outputSchema to get structured JSON back. ' +
      'Can change state on the target site (clicks, form submits) — treat it as destructive and do not run it ' +
      'without explicit user intent. Returns the task result plus run metadata (steps taken, duration, runId).',
    inputSchema,
    outputSchema,
    execute: async input => {
      const client = getAnakinClient(config);
      const body: Record<string, unknown> = { prompt: input.prompt, async: true };
      if (input.url) body.url = input.url;
      if (input.sessionId) body.session_id = input.sessionId;
      if (input.maxSteps !== undefined) body.max_steps = input.maxSteps;
      if (input.timeoutMs !== undefined) body.timeout_ms = input.timeoutMs;
      if (input.outputSchema) body.output_schema = input.outputSchema;

      const accepted = await client.post('/ai/evaluate', body);
      const workflowId = accepted['workflow_id'];

      let result: Record<string, unknown>;
      if (typeof workflowId !== 'string' || !workflowId) {
        // Service answered synchronously (shouldn't happen with async: true) —
        // `accepted` IS the BrowserTaskResult, not a job envelope wrapping one.
        result = accepted;
      } else {
        const job = await client.pollUntil(
          `/ai/jobs/${encodeURIComponent(workflowId)}`,
          body => body.status === 'completed' || body.status === 'failed' || body.status === 'timed_out',
        );
        if (job.status === 'failed' || job.status === 'timed_out') {
          const message = typeof job.error === 'string' ? job.error : `unknown`;
          throw new Error(`Browser task ${job.status}: ${message}`);
        }
        result = (job.result ?? job) as Record<string, unknown>;
      }

      return {
        success: typeof result.success === 'boolean' ? result.success : undefined,
        result: result.result,
        stepsTaken: Array.isArray(result.steps) ? result.steps.length : undefined,
        iterations: typeof result.iterations === 'number' ? result.iterations : undefined,
        cached: typeof result.cached === 'boolean' ? result.cached : undefined,
        durationMs: typeof result.duration_ms === 'number' ? result.duration_ms : undefined,
        runId: typeof result.run_id === 'string' ? result.run_id : undefined,
      } satisfies BrowserTaskOutput;
    },
  });
}
