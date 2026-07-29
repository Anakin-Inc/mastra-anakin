/**
 * Shared pieces for the four monitor_* tools.
 *
 * The API returns each monitor's `alertWebhookSecret` (an HMAC signing
 * secret) inline. A secret that enters an agent's chat transcript is
 * compromised by definition, so every monitor response is passed through
 * redactSecrets() before it's returned from a tool — the user retrieves the
 * real value from the Anakin dashboard instead.
 */
const SECRET_KEYS = new Set(['alertWebhookSecret']);
const REDACTED = '[redacted — view in the Anakin dashboard]';

/** Deep-copy `value` with any secret-bearing keys replaced. */
export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SECRET_KEYS.has(k) && v ? REDACTED : redactSecrets(v);
    }
    return out;
  }
  return value;
}
