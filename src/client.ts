const DEFAULT_BASE_URL = 'https://api.anakin.io/v1';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_POLL_INTERVAL_MS = 2_000;
const DEFAULT_POLL_MAX_INTERVAL_MS = 10_000;
const DEFAULT_POLL_TIMEOUT_MS = 120_000;

export interface AnakinClientOptions {
  [key: string]: unknown;
  /** Anakin API key. Falls back to the ANAKIN_API_KEY env var. */
  apiKey?: string;
  /** Override the API base URL (default https://api.anakin.io/v1). */
  baseUrl?: string;
  /** Per-request timeout in ms (default 30000). */
  timeout?: number;
  /** Initial polling delay in ms for async jobs (default 2000). */
  pollIntervalMs?: number;
  /** Cap on exponential polling backoff, in ms (default 10000). */
  pollMaxIntervalMs?: number;
  /** Total time budget for polling a job before giving up, in ms (default 120000). */
  pollTimeoutMs?: number;
}

interface JobEnvelope {
  jobId?: string;
  job_id?: string;
  id?: string;
  status?: string;
  error?: unknown;
  [key: string]: unknown;
}

export interface AnakinClient {
  /** Raw POST against the Anakin API, relative to the configured base URL. */
  post: (path: string, body?: unknown) => Promise<Record<string, unknown>>;
  /** Raw GET against the Anakin API, relative to the configured base URL. */
  get: (path: string) => Promise<Record<string, unknown>>;
  /**
   * Submit an async job (POST submitPath), then poll pollPathPrefix/:jobId
   * until the job reaches a terminal status ("completed" or "failed").
   * Throws if the job fails or if pollTimeoutMs is exceeded.
   */
  submitAndPoll: (submitPath: string, pollPathPrefix: string, body: unknown) => Promise<Record<string, unknown>>;
}

function requireApiKey(config?: AnakinClientOptions): string {
  const apiKey = config?.apiKey ?? process.env.ANAKIN_API_KEY;
  if (!apiKey) {
    throw new Error('Anakin API key is required. Pass { apiKey } or set the ANAKIN_API_KEY env var.');
  }
  return apiKey;
}

function isTerminal(body: JobEnvelope): boolean {
  return body.status === 'completed' || body.status === 'failed';
}

function extractJobId(submitted: JobEnvelope): string {
  const jobId = submitted.jobId ?? submitted.job_id ?? submitted.id;
  if (typeof jobId !== 'string' || !jobId) {
    throw new Error(`Anakin API response did not include a job id: ${JSON.stringify(submitted)}`);
  }
  return jobId;
}

async function anakinRequest(
  method: 'GET' | 'POST',
  path: string,
  apiKey: string,
  baseUrl: string,
  timeout: number,
  body?: unknown,
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const responseText = await response.text();
    const json = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      const message =
        typeof json?.message === 'string'
          ? json.message
          : typeof json?.error === 'string'
            ? json.error
            : `Anakin API request to ${path} failed with status ${response.status}`;
      throw new Error(message);
    }

    return json as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Anakin API request to ${path} timed out after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getAnakinClient(config?: AnakinClientOptions): AnakinClient {
  const apiKey = requireApiKey(config);
  const baseUrl = config?.baseUrl ?? DEFAULT_BASE_URL;
  const timeout = config?.timeout ?? DEFAULT_TIMEOUT_MS;
  const pollIntervalMs = config?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const pollMaxIntervalMs = config?.pollMaxIntervalMs ?? DEFAULT_POLL_MAX_INTERVAL_MS;
  const pollTimeoutMs = config?.pollTimeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;

  return {
    post: (path, body) => anakinRequest('POST', path, apiKey, baseUrl, timeout, body),
    get: path => anakinRequest('GET', path, apiKey, baseUrl, timeout),
    submitAndPoll: async (submitPath, pollPathPrefix, body) => {
      const submitted = await anakinRequest('POST', submitPath, apiKey, baseUrl, timeout, body);
      const jobId = extractJobId(submitted);
      const deadline = Date.now() + pollTimeoutMs;
      let interval = pollIntervalMs;

      for (;;) {
        const result = await anakinRequest('GET', `${pollPathPrefix}/${jobId}`, apiKey, baseUrl, timeout);

        if (isTerminal(result)) {
          if (result.status === 'failed') {
            const message = typeof result.error === 'string' ? result.error : `Anakin job ${jobId} failed`;
            throw new Error(message);
          }
          return result;
        }

        if (Date.now() + interval > deadline) {
          throw new Error(`Anakin job ${jobId} did not complete within ${pollTimeoutMs}ms`);
        }

        await new Promise(resolve => setTimeout(resolve, interval));
        interval = Math.min(interval * 1.5, pollMaxIntervalMs);
      }
    },
  };
}
