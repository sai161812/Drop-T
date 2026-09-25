import { Router, Request, Response } from 'express';
import { HumanResponseSubmissionSchema, PublicFeedbackViewData } from '@droptest/shared';
import { TestRepository } from '../db/testRepository.js';

export const feedbackRouter = Router();
const submissionWindows = new Map<string, { count: number; expires: number }>();
feedbackRouter.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return next();
  const now = Date.now();
  for (const [key, window] of submissionWindows) if (window.expires <= now) submissionWindows.delete(key);
  const key = req.ip || 'unknown';
  const window = submissionWindows.get(key) || { count: 0, expires: now + 60000 };
  submissionWindows.set(key, window);
  if (++window.count > 30) {
    res.setHeader('Retry-After', String(Math.ceil((window.expires - now) / 1000)));
    return res.status(429).json({ error: 'Too many responses. Please wait a minute and try again.' });
  }
  next();
});

// GET /api/feedback/:tokenOrId - Public unguided view of options A and B
feedbackRouter.get('/:tokenOrId', (req: Request, res: Response) => {
  try {
    const tokenOrId = String(req.params.tokenOrId);
    const test = TestRepository.getByFeedbackToken(tokenOrId);
    if (!test) {
      return res.status(404).json({ error: 'Feedback page not found or link has expired' });
    }

    // Public view: Expose ONLY information necessary for buyer comparison
    // Strictly zero simulated profile results, zero prompt templates, zero internal config
    const publicData: PublicFeedbackViewData = {
      test_id: test.test.id,
      feedback_token: test.test.feedback_token || test.test.id,
      title: test.test.title,
      domain_id: test.test.domain_id,
      short_value_prop: test.offering.short_value_prop,
      description: test.offering.description,
      currency: test.offering.currency,
      period: test.offering.period,
      domain_specific_data: Object.fromEntries(Object.entries(test.offering.domain_specific_data).filter(([key]) => ['item_type', 'material', 'sizes', 'fulfillment_details', 'item_name', 'portion', 'ingredients_allergens', 'pickup_delivery_mode', 'availability_window', 'core_use_case', 'platform_language', 'pricing_type', 'service_support_availability'].includes(key))),
      comparison_lever: test.comparison_lever,
      options: {
        A: {
          id: 'A',
          name: test.options.A.name,
          price: test.options.A.price,
          primary_message: test.options.A.primary_message,
          served_markets: test.options.A.served_markets,
          fulfillment_mode: test.options.A.fulfillment_mode,
          images: test.options.A.images
        },
        B: {
          id: 'B',
          name: test.options.B?.name || test.options.A.name,
          price: test.options.B?.price ?? test.options.A.price,
          primary_message: test.options.B?.primary_message || test.options.A.primary_message,
          served_markets: test.options.B?.served_markets || test.options.A.served_markets,
          fulfillment_mode: test.options.B?.fulfillment_mode || test.options.A.fulfillment_mode,
          images: test.options.B?.images || test.options.A.images
        }
      }
    };

    res.json(publicData);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load feedback details. Please try again.' });
  }
});

// POST /api/feedback/:tokenOrId - Submit anonymous human choice & optional reason
feedbackRouter.post('/:tokenOrId', (req: Request, res: Response) => {
  try {
    const tokenOrId = String(req.params.tokenOrId);
    const parseResult = HumanResponseSubmissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid response submission',
        issues: parseResult.error.issues
      });
    }

    const test = TestRepository.getByFeedbackToken(tokenOrId);
    if (!test) {
      return res.status(404).json({ error: 'Feedback page not found or link has expired' });
    }

    const clientToken = parseResult.data.client_token || parseResult.data.token;

    const { response, is_updated } = TestRepository.recordHumanResponse(
      test.test.id,
      parseResult.data.choice,
      parseResult.data.reason,
      clientToken
    );

    res.status(201).json({ 
      success: true, 
      response_id: response.id,
      is_updated,
      message: is_updated ? 'Your feedback was updated' : 'Your feedback was recorded' 
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record response. Please try again.' });
  }
});

// GET /api/feedback/:tokenOrId/stats - Get human responses (strictly separate from simulated profiles)
feedbackRouter.get('/:tokenOrId/stats', (req: Request, res: Response) => {
  try {
    const tokenOrId = String(req.params.tokenOrId);
    const test = TestRepository.getByFeedbackToken(tokenOrId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const stats = TestRepository.getHumanFeedback(test.test.id);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve feedback statistics', message: error.message });
  }
});
