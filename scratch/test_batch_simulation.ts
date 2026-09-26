import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { generatePanelProfiles } from '../server/src/simulation/profileGenerator.js';
import { buildGroqResponseSchema } from '../server/src/simulation/groqEvaluator.js';

dotenv.config();

const REFERENCE_FIELDS = [
  'price', 'primary_message', 'fulfillment_mode', 'served_markets', 'confirmed_visual_description', 
  'images_context', 'name', 'short_value_prop', 'description', 'currency', 'period', 'domain_specific_data', 
  'budget_min', 'budget_max', 'budget_range', 'use_case', 'constraints', 'priorities', 'access_mode', 
  'market', 'segment'
];

export class GroqKeyPool {
  private keys: string[];
  private cooldowns = new Map<string, number>();
  private idx = 0;

  constructor(keys: string[]) {
    this.keys = Array.from(new Set(keys.map(k => k?.trim()).filter((k): k is string => Boolean(k && k.length > 0))));
  }

  get keyCount() { return this.keys.length; }

  acquire(): { key: string; index: number; isCooldown: boolean; waitMs: number } {
    if (this.keys.length === 0) throw new Error('No Groq API keys configured');
    const now = Date.now();
    for (let i = 0; i < this.keys.length; i++) {
      const targetIdx = (this.idx + i) % this.keys.length;
      const k = this.keys[targetIdx];
      const cd = this.cooldowns.get(k) || 0;
      if (now >= cd) {
        this.idx = (targetIdx + 1) % this.keys.length;
        return { key: k, index: targetIdx, isCooldown: false, waitMs: 0 };
      }
    }
    // All keys are currently in cooldown; find minimum wait time
    let minWait = 10000;
    let bestIdx = 0;
    for (let i = 0; i < this.keys.length; i++) {
      const k = this.keys[i];
      const cd = this.cooldowns.get(k) || 0;
      const wait = cd - now;
      if (wait < minWait) {
        minWait = wait;
        bestIdx = i;
      }
    }
    return { key: this.keys[bestIdx], index: bestIdx, isCooldown: true, waitMs: Math.max(500, minWait) };
  }

  markCooldown(key: string, ms: number) {
    this.cooldowns.set(key, Date.now() + ms);
  }
}

async function simulate50Personas() {
  console.log('🚀 Generating 50 distinct test personas...');
  const testId = 'test_sim_01';
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
  console.log(`Generated ${profiles.length} profiles.`);

  const option = {
    name: '💧 PureGlow Smart Water Bottle',
    price: 79,
    primary_message: '280nm UV-C LED sterilization and Bluetooth intake tracking',
    served_markets: ['North America', 'Europe', 'India'],
    fulfillment_mode: 'Direct tracked shipping',
    images: []
  };

  const rawKeys = [
    process.env.GROQ_API_KEY || '',
    process.env.GROQ_API_KEY_2 || '',
    process.env.GROQ_API_KEY_3 || '',
    ...(process.env.GROQ_API_KEYS || '').split(',')
  ];

  const pool = new GroqKeyPool(rawKeys);
  console.log(`Key pool initialized with ${pool.keyCount} unique key(s).`);

  const batchSize = 5;
  const batches: any[][] = [];
  for (let i = 0; i < profiles.length; i += batchSize) {
    batches.push(profiles.slice(i, i + batchSize));
  }

  console.log(`Split 50 personas into ${batches.length} batches of 5.`);
  const startTime = Date.now();
  let completed = 0;

  for (let bIdx = 0; bIdx < batches.length; bIdx++) {
    const batch = batches[bIdx];
    let batchSuccess = false;
    let attempts = 0;

    const responseSchema = buildGroqResponseSchema(batch.map((p: any) => p.id), REFERENCE_FIELDS);
    const systemPrompt = `You are an impartial simulated consumer perspective evaluator. For each persona, evaluate their response to the product offering.
Rules:
1. response: "interested" | "unsure" | "not_interested".
2. reason: concise (1-2 sentences).
3. factor_tags: 1-3 from ["price","fit","access","message","creative","other"].
4. referenced_fields: relevant fields.
5. source_ids: [].
Return JSON matching schema.`;

    const userPrompt = JSON.stringify({
      product: option,
      profiles: batch.map((p: any) => ({
        profile_id: p.id,
        segment: p.segment,
        market: p.market,
        budget_range: `USD ${p.budget_min} - ${p.budget_max}`,
        use_case: p.use_case,
        constraints: p.constraints,
        priorities: p.priorities
      }))
    });

    while (!batchSuccess && attempts < 5) {
      attempts++;
      const keyInfo = pool.acquire();
      if (keyInfo.isCooldown && keyInfo.waitMs > 0) {
        console.log(`[Rate Limit Guard] All keys in cooldown. Waiting ${(keyInfo.waitMs / 1000).toFixed(1)}s before retry...`);
        await new Promise(r => setTimeout(r, keyInfo.waitMs));
      }

      const groq = new Groq({ apiKey: keyInfo.key, maxRetries: 0 });
      const bStart = Date.now();

      try {
        const res = await groq.chat.completions.create({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_schema', json_schema: { name: 'profile_evaluations', strict: true, schema: responseSchema } },
          max_completion_tokens: 1200,
          temperature: 0.2
        });

        const parsed = JSON.parse(res.choices[0]?.message?.content || '{}');
        const evalCount = parsed.evaluations?.length || 0;
        completed += evalCount;
        batchSuccess = true;
        console.log(`[Batch ${bIdx + 1}/${batches.length}] Done in ${Date.now() - bStart}ms using Key #${keyInfo.index + 1} -> +${evalCount} evals (Progress: ${completed}/50)`);
      } catch (err: any) {
        // Parse rate limit cooldown
        let cooldownMs = 8500;
        const match = String(err.message || '').match(/try again in ([\d\.]+)s/i);
        if (match && match[1]) {
          cooldownMs = Math.ceil(parseFloat(match[1]) * 1000) + 500;
        }
        console.warn(`[Batch ${bIdx + 1} Attempt ${attempts}] 429 Rate Limit on Key #${keyInfo.index + 1}. Cooldown: ${(cooldownMs / 1000).toFixed(1)}s`);
        pool.markCooldown(keyInfo.key, cooldownMs);

        // If we have another key ready, try immediately on next loop iteration without waiting!
        const nextKey = pool.acquire();
        if (!nextKey.isCooldown) {
          console.log(`🔄 Immediately switching to available Key #${nextKey.index + 1} with zero delay!`);
        } else {
          console.log(`⏳ Single key / all keys busy. Waiting ${(nextKey.waitMs / 1000).toFixed(1)}s...`);
          await new Promise(r => setTimeout(r, nextKey.waitMs));
        }
      }
    }
  }

  console.log(`\n🎉 Completed ${completed}/50 persona evaluations in ${((Date.now() - startTime) / 1000).toFixed(1)}s!`);
}

simulate50Personas();
