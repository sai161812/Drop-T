import Groq from 'groq-sdk';
import dotenv from 'dotenv';
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

const sampleProfiles = [
  { profile_id: 'prof_01', segment: 'intended', market: 'North America', budget_range: 'USD 50 - 120', use_case: 'Gym workout hydration', constraints: ['lightweight'], priorities: ['cleanliness'], access_mode: 'delivery' },
  { profile_id: 'prof_02', segment: 'intended', market: 'Europe', budget_range: 'USD 50 - 120', use_case: 'Office daily hydration', constraints: ['quiet'], priorities: ['smart tracking'], access_mode: 'delivery' },
  { profile_id: 'prof_03', segment: 'adjacent', market: 'North America', budget_range: 'USD 30 - 80', use_case: 'Hiking & outdoor trips', constraints: ['battery life'], priorities: ['durability'], access_mode: 'delivery' },
  { profile_id: 'prof_04', segment: 'adjacent', market: 'India', budget_range: 'USD 20 - 50', use_case: 'Commute hydration', constraints: ['budget'], priorities: ['price'], access_mode: 'delivery' },
  { profile_id: 'prof_05', segment: 'contrasting', market: 'Europe', budget_range: 'USD 10 - 25', use_case: 'Basic tap water cup', constraints: ['no electronics'], priorities: ['low cost'], access_mode: 'delivery' }
];

async function testModel(groq: Groq, model: string, useSchema: boolean) {
  const start = Date.now();
  try {
    const res = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an impartial simulated consumer perspective evaluator. For each persona evaluate their response to the product offering. Return a valid JSON matching the schema.'
        },
        {
          role: 'user',
          content: JSON.stringify({
            product: 'PureGlow Smart Water Bottle with UV-C cap ($79)',
            profiles: sampleProfiles
          })
        }
      ],
      response_format: useSchema
        ? { type: 'json_schema', json_schema: { name: 'profile_evaluations', strict: true, schema: responseSchema } }
        : { type: 'json_object' },
      max_completion_tokens: 2000,
      temperature: 0.2
    });

    const elapsed = Date.now() - start;
    const content = res.choices[0]?.message?.content;
    const parsed = JSON.parse(content || '{}');
    console.log(`[PASS] Model ${model} (schema: ${useSchema}): ${elapsed}ms -> ${parsed.evaluations?.length || 0} evaluations returned`);
    return { model, elapsed, success: true };
  } catch (err: any) {
    console.log(`[FAIL] Model ${model} (schema: ${useSchema}): ${Date.now() - start}ms -> ${err.message}`);
    return { model, elapsed: Date.now() - start, success: false, error: err.message };
  }
}

async function run() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log('--- Benchmarking Models ---');
  await testModel(groq, 'openai/gpt-oss-20b', true);
  await testModel(groq, 'openai/gpt-oss-120b', true);
  await testModel(groq, 'qwen/qwen3.8-27b', false);
}

run();
