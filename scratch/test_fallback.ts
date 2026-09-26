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

async function testWithSmartFallback() {
  console.log('🚀 Testing Smart Model Fallback (120b -> 20b on 429/timeout)...\n');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const testId = 'test_fallback';
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
    message: '280nm UV-C LED sterilization and Bluetooth intake tracking',
    fulfillment: 'Direct shipping'
  };

  const batches: any[][] = [];
  for (let i = 0; i < profiles.length; i += 5) {
    batches.push(profiles.slice(i, i + 5));
  }

  const models = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
  let completed = 0;
  const start = Date.now();

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const bStart = Date.now();
    const responseSchema = buildGroqResponseSchema(batch.map(p => p.id), REFERENCE_FIELDS);

    const systemPrompt = `Impartial simulated consumer perspective evaluator. Grounded strictly in persona attributes.
Rules:
1. "response": "interested" | "unsure" | "not_interested".
2. "reason": concise (1-2 sentences) grounded in persona use case, budget, priorities, constraints vs product.
3. "factor_tags": 1-3 from ["price","fit","access","message","creative","other"].
4. "referenced_fields": actual fields influencing judgment.
5. "source_ids": [].
Output JSON matching schema: {"evaluations": [{ "profile_id": "...", "response": "...", "reason": "...", "primary_objection": null, "factor_tags": [...], "referenced_fields": [...], "source_ids": [] }]}.`;

    const userPrompt = JSON.stringify({
      product: option,
      profiles: batch.map(p => ({
        profile_id: p.id,
        segment: p.segment,
        market: p.market,
        budget_range: `USD ${p.budget_min} - ${p.budget_max}`,
        use_case: p.use_case,
        constraints: p.constraints,
        priorities: p.priorities
      }))
    });

    let batchDone = false;
    for (const model of models) {
      if (batchDone) break;
      try {
        const res = await groq.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_schema', json_schema: { name: 'profile_evaluations', strict: true, schema: responseSchema } },
          max_completion_tokens: 1500,
          temperature: 0.2
        });

        const parsed = JSON.parse(res.choices[0]?.message?.content || '{}');
        const count = parsed.evaluations?.length || 0;
        completed += count;
        batchDone = true;
        console.log(`[Batch ${i + 1}/${batches.length}] Done in ${Date.now() - bStart}ms via ${model} -> +${count} evals (Progress: ${completed}/50)`);
      } catch (err: any) {
        console.warn(`[Batch ${i + 1}] Model ${model} encountered: ${err.message.slice(0, 80)}... Trying fallback!`);
      }
    }
  }

  console.log(`\n🎉 Completed ${completed}/50 in ${((Date.now() - start) / 1000).toFixed(2)}s!`);
}

testWithSmartFallback();
