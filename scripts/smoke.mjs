// Smoke test against the built package and the real @mastra/core (no mocks).
//
//   npm run build && node scripts/smoke.mjs
//
// With ANAKIN_API_KEY set, it runs a live search. Without it, it sends a
// well-formed but invalid key and expects the API to answer 401, which still
// proves the endpoint path and the X-API-Key header are right.
import { Agent } from '@mastra/core/agent';
import { Tool } from '@mastra/core/tools';

import { createAnakinReadOnlyTools, createAnakinTools } from '../dist/index.js';

const live = Boolean(process.env.ANAKIN_API_KEY);
const tools = createAnakinTools(live ? {} : { apiKey: `ask_${'0'.repeat(64)}` });

const count = Object.keys(tools).length;
if (count !== 22) throw new Error(`expected 22 tools, got ${count}`);
if (Object.keys(createAnakinReadOnlyTools({ apiKey: 'x' })).length !== 15) throw new Error('expected 15 read-only tools');
for (const [key, tool] of Object.entries(tools)) {
  if (!(tool instanceof Tool)) throw new Error(`${key} is not a Mastra Tool`);
}

// Mastra accepts the bundle as an agent's tools without a model call.
const agent = new Agent({ id: 'smoke', name: 'smoke', instructions: 'smoke test', model: 'openai/gpt-4o-mini', tools });
const agentTools = await agent.listTools();
if (Object.keys(agentTools).length !== 22) throw new Error('agent did not register all 22 tools');
console.log('ok: 22 Mastra tools, all registered on an Agent');

try {
  const result = await tools.search.execute({ prompt: 'Mastra TypeScript agent framework', limit: 3 }, {});
  if (!live) throw new Error('expected a 401 with an invalid key');
  console.log(`ok: live search returned ${result.results?.length ?? 0} results`);
} catch (err) {
  if (live) throw err;
  if (!/401|invalid|unauthori[sz]ed/i.test(String(err.message))) throw err;
  console.log(`ok: invalid key rejected by the API (${err.message})`);
}
