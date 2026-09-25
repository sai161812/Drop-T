import { v4 as uuidv4 } from 'uuid';
import { 
  FullTestResponse, 
  Profile, 
  Option, 
  Evaluation, 
  Run, 
  OptionId,
  evaluateEligibility,
  GroqBatchEvaluationResponseSchema,
  GroqEvaluationItem,
  PANEL_CONSTANTS
} from '@droptest/shared';
import { config } from '../config.js';
import { TestRepository } from '../db/testRepository.js';

export interface EvaluatorOptions {
  batchSize?: number;
  maxConcurrency?: number;
  timeoutMs?: number;
  maxRetries?: number;
}

const DEFAULT_OPTIONS: Required<EvaluatorOptions> = {
  batchSize: 5,
  maxConcurrency: 2,
  timeoutMs: 30000,
  maxRetries: 3
};

export class GroqEvaluator {
  /**
   * Check if Groq API key is present
   */
  static isConfigured(): boolean {
    return Boolean(config.groqApiKey && config.groqApiKey.trim().length > 0);
  }

  /**
   * Run a quick smoke test against Groq with a single sample profile
   */
  static async smokeTest(): Promise<{
    success: boolean;
    model: string;
    sampleEvaluation?: GroqEvaluationItem;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        model: config.groqModel,
        error: 'GROQ_API_KEY is not configured on the server. Please set GROQ_API_KEY in server environment (.env).'
      };
    }

    const sampleProfile: Profile = {
      id: 'prof_smoke',
      test_id: 'smoke_test',
      segment: 'intended',
      market: 'Online',
      budget_min: 20,
      budget_max: 60,
      use_case: 'Daily office workwear shirt',
      constraints: ['Requires easy machine laundering'],
      priorities: ['100% natural organic cotton or linen'],
      access_mode: 'Standard shipping',
      created_at: new Date().toISOString()
    };

    const sampleOption = {
      name: 'Organic Linen Shirt $45',
      price: 45,
      primary_message: 'Breathable linen shirt handcrafted for warm climates',
      served_markets: ['Online'],
      fulfillment_mode: 'Standard shipping',
      images: []
    };

    try {
      const results = await this.evaluateBatchWithGroq(
        [sampleProfile],
        sampleOption,
        'Clothing & Accessories',
        'Smoke test offering',
        1
      );

      if (results.length > 0) {
        return {
          success: true,
          model: config.groqModel,
          sampleEvaluation: results[0]
        };
      } else {
        return {
          success: false,
          model: config.groqModel,
          error: 'Groq returned empty evaluations array'
        };
      }
    } catch (err: any) {
      return {
        success: false,
        model: config.groqModel,
        error: err.message || 'Groq smoke test failed'
      };
    }
  }

  /**
   * Execute or resume a full 100-evaluation simulation run across Option A and Option B
   */
  static async executeRun(
    testId: string, 
    existingRunId?: string,
    options: EvaluatorOptions = {}
  ): Promise<{ run: Run; evaluations: Evaluation[] }> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const fullTest = TestRepository.getById(testId);
    if (!fullTest) {
      throw new Error(`Test with ID "${testId}" not found`);
    }

    // Check / retrieve frozen profiles
    let profiles = TestRepository.getProfiles(testId);
    if (profiles.length === 0) {
      throw new Error('No profiles found for test. Please generate panel profiles first.');
    }

    // Get or create Run record
    let run: Run;
    if (existingRunId) {
      const found = TestRepository.getRunById(existingRunId);
      if (!found) throw new Error(`Run "${existingRunId}" not found`);
      run = found;
      TestRepository.updateRun(run.id, { status: 'running', error_message: null });
    } else {
      run = TestRepository.createRun(
        testId,
        fullTest.comparison_lever,
        fullTest.audience_config.expected_spend_min + fullTest.audience_config.expected_spend_max, // seed tag
        config.groqModel
      );
    }

    // Check if Groq API key is configured
    if (!this.isConfigured()) {
      const errorMsg = 'GROQ_API_KEY is not configured on the server. Please set GROQ_API_KEY in server environment (.env).';
      TestRepository.updateRun(run.id, {
        status: 'failed',
        error_message: errorMsg
      });
      const currentEvals = TestRepository.getEvaluationsByRunId(run.id);
      return {
        run: TestRepository.getRunById(run.id)!,
        evaluations: currentEvals
      };
    }

    try {
      // 1. Process Option A
      await this.processOptionEvaluations(run.id, fullTest, 'A', fullTest.options.A, profiles, opts);

      // 2. Process Option B
      await this.processOptionEvaluations(run.id, fullTest, 'B', fullTest.options.B, profiles, opts);

      // 3. Finalize run status
      const finalEvals = TestRepository.getEvaluationsByRunId(run.id);
      const isComplete = finalEvals.length === PANEL_CONSTANTS.TOTAL_EVALUATIONS;

      const updatedRun = TestRepository.updateRun(run.id, {
        status: isComplete ? 'completed' : 'partial',
        total_evaluations_completed: finalEvals.length,
        completed_at: isComplete ? new Date().toISOString() : null,
        error_message: isComplete ? null : `Incomplete run: ${finalEvals.length} / 100 evaluations recorded.`
      });

      return {
        run: updatedRun || run,
        evaluations: finalEvals
      };
    } catch (err: any) {
      const currentEvals = TestRepository.getEvaluationsByRunId(run.id);
      const updatedRun = TestRepository.updateRun(run.id, {
        status: currentEvals.length > 0 ? 'partial' : 'failed',
        total_evaluations_completed: currentEvals.length,
        error_message: err.message || 'Simulation execution encountered an error'
      });

      return {
        run: updatedRun || run,
        evaluations: currentEvals
      };
    }
  }

  /**
   * Process all 50 profile evaluations for a single option (A or B)
   */
  private static async processOptionEvaluations(
    runId: string,
    fullTest: FullTestResponse,
    optionId: OptionId,
    option: Option,
    profiles: Profile[],
    opts: Required<EvaluatorOptions>
  ): Promise<void> {
    const existingEvaluations = TestRepository.getEvaluationsByRunId(runId);
    const completedProfileIds = new Set(
      existingEvaluations.filter(e => e.option_id === optionId).map(e => e.profile_id)
    );

    const now = new Date().toISOString();
    const servedProfilesToEvaluate: Profile[] = [];
    const unservedEvaluations: Evaluation[] = [];

    // Separate into deterministic unserved vs served
    for (const profile of profiles) {
      if (completedProfileIds.has(profile.id)) {
        continue; // Already completed in prior attempt
      }

      const eligibility = evaluateEligibility(profile, option);

      if (!eligibility.is_eligible) {
        // Deterministic access gate: unserved profiles are immediately recorded with NO model call
        unservedEvaluations.push({
          id: uuidv4(),
          run_id: runId,
          test_id: fullTest.test.id,
          profile_id: profile.id,
          option_id: optionId,
          access_status: 'unserved',
          response: 'unavailable',
          reason: eligibility.reason_if_unserved || `Market "${profile.market}" is outside "${option.name}" coverage.`,
          primary_objection: 'Outside served markets',
          factor_tags: ['access'],
          referenced_fields: ['served_markets'],
          created_at: now
        });
      } else {
        servedProfilesToEvaluate.push(profile);
      }
    }

    // Persist unserved evaluations immediately
    if (unservedEvaluations.length > 0) {
      TestRepository.saveEvaluations(unservedEvaluations);
      const currentTotal = TestRepository.getEvaluationsByRunId(runId).length;
      TestRepository.updateRun(runId, { total_evaluations_completed: currentTotal });
    }

    if (servedProfilesToEvaluate.length === 0) {
      return;
    }

    // Chunk served profiles into batches (5-10 per request)
    const batches: Profile[][] = [];
    for (let i = 0; i < servedProfilesToEvaluate.length; i += opts.batchSize) {
      batches.push(servedProfilesToEvaluate.slice(i, i + opts.batchSize));
    }

    // Process batches with bounded concurrency (default 2)
    const domainLabel = fullTest.test.domain_id.replace(/_/g, ' ');
    const offeringContext = `${fullTest.offering.short_value_prop}. ${fullTest.offering.description}`;

    for (let i = 0; i < batches.length; i += opts.maxConcurrency) {
      const concurrentChunk = batches.slice(i, i + opts.maxConcurrency);

      const batchPromises = concurrentChunk.map(async (batch) => {
        let attempts = 0;
        let batchSuccess = false;
        let profilesToQuery = [...batch];

        while (attempts < opts.maxRetries && !batchSuccess && profilesToQuery.length > 0) {
          attempts++;
          try {
            const rawEvaluations = await this.evaluateBatchWithGroq(
              profilesToQuery,
              option,
              domainLabel,
              offeringContext,
              attempts
            );

            // Match and convert to Evaluation entities
            const newEvaluations: Evaluation[] = [];
            const returnedProfileIds = new Set<string>();

            for (const item of rawEvaluations) {
              const matchedProfile = profilesToQuery.find(p => p.id === item.profile_id);
              if (matchedProfile) {
                returnedProfileIds.add(item.profile_id);
                newEvaluations.push({
                  id: uuidv4(),
                  run_id: runId,
                  test_id: fullTest.test.id,
                  profile_id: matchedProfile.id,
                  option_id: optionId,
                  access_status: 'served',
                  response: item.response,
                  reason: item.reason,
                  primary_objection: item.primary_objection || undefined,
                  factor_tags: item.factor_tags,
                  referenced_fields: item.referenced_fields,
                  created_at: new Date().toISOString()
                });
              }
            }

            // Persist valid evaluations
            if (newEvaluations.length > 0) {
              TestRepository.saveEvaluations(newEvaluations);
              const currentTotal = TestRepository.getEvaluationsByRunId(runId).length;
              TestRepository.updateRun(runId, { total_evaluations_completed: currentTotal });
            }

            // Check if any profiles in this batch were missed
            profilesToQuery = profilesToQuery.filter(p => !returnedProfileIds.has(p.id));
            if (profilesToQuery.length === 0) {
              batchSuccess = true;
            } else {
              // Missing profiles; wait briefly before retry
              await new Promise(r => setTimeout(r, 1000 * attempts));
            }
          } catch (batchErr: any) {
            console.warn(`Groq batch evaluation attempt ${attempts} failed:`, batchErr.message);
            if (attempts >= opts.maxRetries) {
              // Bounded retry exhausted: do not invent responses; continue with partial state
              break;
            }
            // Exponential backoff
            const delay = Math.min(6000, 1000 * Math.pow(2, attempts));
            await new Promise(r => setTimeout(r, delay));
          }
        }
      });

      await Promise.all(batchPromises);
    }
  }

  /**
   * Send a single batch of profiles to Groq API with JSON mode and Zod validation
   */
  private static async evaluateBatchWithGroq(
    profiles: Profile[],
    option: Option | { name: string; price: number; primary_message: string; fulfillment_mode: string; images?: any[] },
    domainLabel: string,
    offeringContext: string,
    _attemptNumber: number
  ): Promise<GroqEvaluationItem[]> {
    const apiKey = config.groqApiKey;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set');
    }

    // Build system prompt
    const systemPrompt = `You are an impartial simulated consumer perspective evaluator for product launch research.
CRITICAL MANDATE: This is a SIMULATED PERSPECTIVE strictly grounded in defined persona attributes, NEVER a prediction of a real person's actual behavior.

For each persona provided, evaluate their response to the specific product offering and option details.

Evaluation Rules:
1. "response" MUST be one of: "interested", "unsure", "not_interested".
2. "reason" MUST be concise (1-2 sentences) and grounded strictly in the persona's use case, budget, priorities, and constraints vs the product's actual price, message, materials, and fulfillment.
3. If the product price exceeds the persona's budget_max, they should generally be "unsure" or "not_interested" with "price" as an objection.
4. If the product fits their use case and is within budget, they should be "interested".
5. Image visual descriptions are provided as text context. Only refer to imagery if a confirmed visual description is present.
6. "factor_tags" MUST contain 1-3 tags from: ["price", "fit", "access", "message", "creative", "other"].
7. "referenced_fields" MUST list the actual product/persona fields that influenced the judgment (e.g. ["price", "budget_max", "use_case", "primary_message", "fulfillment_mode"]).
8. Return a valid JSON object matching the schema: {"evaluations": [{ "profile_id": "...", "response": "...", "reason": "...", "primary_objection": "...", "factor_tags": [...], "referenced_fields": [...] }]}.
You MUST return an evaluation for every profile_id in the input list.`;

    // Build user prompt
    const userPrompt = JSON.stringify({
      domain: domainLabel,
      offering_overview: offeringContext,
      option_being_evaluated: {
        name: option.name,
        price: option.price,
        primary_message: option.primary_message,
        fulfillment_mode: option.fulfillment_mode,
        images_context: (option.images || []).map((img: any) => ({
          filename: img.filename,
          confirmed_visual_description: img.confirmed_visual_description || 'Image uploaded without description'
        }))
      },
      profiles_to_evaluate: profiles.map(p => ({
        profile_id: p.id,
        segment: p.segment,
        market: p.market,
        budget_range: `$${p.budget_min} - $${p.budget_max}`,
        use_case: p.use_case,
        constraints: p.constraints,
        priorities: p.priorities,
        access_mode: p.access_mode
      }))
    }, null, 2);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: config.groqTemperature
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let retryAfterSec = 0;
        const retryHeader = response.headers.get('retry-after');
        if (retryHeader) {
          retryAfterSec = parseInt(retryHeader, 10) || 2;
        }

        if (response.status === 429) {
          throw new Error(`Groq rate limit (429): ${errorText}. Retry after ${retryAfterSec}s`);
        }
        throw new Error(`Groq API error (${response.status}): ${errorText}`);
      }

      const responseJson: any = await response.json();
      const content = responseJson.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Groq returned empty response content');
      }

      let parsedJson: any;
      try {
        parsedJson = JSON.parse(content);
      } catch (jsonErr: any) {
        throw new Error(`Failed to parse JSON from Groq response: ${jsonErr.message}`);
      }

      const parseResult = GroqBatchEvaluationResponseSchema.safeParse(parsedJson);
      if (!parseResult.success) {
        // Attempt to repair if evaluations array is wrapped or top-level array
        if (Array.isArray(parsedJson)) {
          const arrResult = GroqBatchEvaluationResponseSchema.safeParse({ evaluations: parsedJson });
          if (arrResult.success) return arrResult.data.evaluations;
        }
        throw new Error(`Groq response failed schema validation: ${parseResult.error.message}`);
      }

      return parseResult.data.evaluations;
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw err;
    }
  }
}
