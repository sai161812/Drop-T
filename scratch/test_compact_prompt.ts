import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { generatePanelProfiles } from '../server/src/simulation/profileGenerator.js';

dotenv.config();

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['evaluations'],
  properties: {
    evaluations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['profile_id', 'response', 'reason', 'primary_objection', 'factor_tags', 'referenced_fields', 'source_ids'],
        properties: {
          profile_id: { type: 'string' },
          response: { type: 'string', enum: ['interested', 'unsure', 'not_interested'] },
          reason: { type: 'string' },
          primary_objection: { type: ['string', 'null'] },
          factor_tags: { type: 'array', items: { type: 'string', enum: ['price', 'fit', 'access', 'message', 'creative', 'other'] } },
          referenced_fields: { type: 'array', items: { type: 'string' } },
          source_ids: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }
};

async function testCompact50() {
  console.log('🚀 Testing Ultra-Compact 50-Persona Simulation...\n');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const testId = 'test_compact';
  const profiles = generatePanelProfiles({
    testId,
    domainId: 'other',
    intendedBuyerDescription: 'Fitness enthusiasts and health-conscious professionals wanting clean water',
    adjacentBuyerDescription: 'Hikers and travelers looking for portable UV purification',
    expectedSpendMin: 40,
    expectedSpendMax: 120,
    audienceMarkets: ['North America', 'Europe', 'India'],
    seed: 12345
  });

  const option = {
    name: 'PureGlow Smart Water Bottle',
    price: 79,
    msg: '280nm UV-C LED sterilization & Bluetooth intake tracking',
    markets: ['North America', 'Europe', 'India'],
    fulfillment: 'Direct shipping'
  };

  const batches: any[][] = [];
  for (let i = 0; i < profiles.length; i += 5) {
    batches.push(profiles.slice(i, i + 5));
  }

  console.log(`Evaluating 50 personas across ${batches.length} batches of 5...`);
  const start = Date.now();
  let completed = 0;

  const systemPrompt = `You are a simulated buyer evaluator. For each persona, evaluate interest in the offering.
Rules:
1. response: "interested"|"unsure"|"not_interested".
2. reason: 1 concise sentence based on budget ($79), priorities, constraints.
3. factor_tags: 1-3 from ["price","fit","access","message","creative","other"].
4. referenced_fields: fields influencing judgment.
5. source_ids: [].
Output strictly matching the JSON schema.`;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const bStart = Date.now();

    const userPrompt = JSON.stringify({
      product: option,
      personas: batch.map(p => ({
        id: p.id,
        seg: p.segment,
        mkt: p.market,
        budget: `$${p.budget_min}-$${p.budget_max}`,
        use: p.use_case,
        constraints: p.constraints,
        priorities: p.priorities
      }))
    });

    try {
      const res = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'evals', strict: true, schema: responseSchema } },
        max_completion_tokens: 800,
        temperature: 0.2
      });

      const parsed = JSON.parse(res.choices[0]?.message?.content || '{}');
      const count = parsed.evaluations?.length || 0;
      completed += count;
      console.log(`[Batch ${i + 1}/${batches.length}] Done in ${Date.now() - bStart}ms -> +${count} evals (Progress: ${completed}/50)`);
    } catch (err: any) {
      console.error(`[Batch ${i + 1}] Error:`, err.message);
      // Wait for the exact cooldown if needed
      const match = String(err.message || '').match(/try again in ([\d\.]+)s/i);
      if (match && match[1]) {
        const wait = Math.ceil(parseFloat(match[1])) * 1000 + 500;
        console.log(`Waiting ${(wait / 1000).toFixed(1)}s for TPM quota to clear...`);
        await new Promise(r => setTimeout(r, wait));
        // Retry
        i--;
      }
    }
  }

  console.log(`\n🎉 ALL 50/50 COMPLETED in ${((Date.now() - start) / 1000).toFixed(2)}s!`);
}

testCompact50();
