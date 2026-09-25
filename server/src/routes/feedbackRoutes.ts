import { Router, Request, Response } from 'express';
import { HumanResponseSubmissionSchema } from '@droptest/shared';
import { TestRepository } from '../db/testRepository.js';

export const feedbackRouter = Router();

// GET /api/feedback/:testId - Public view of options A and B
feedbackRouter.get('/:testId', (req: Request, res: Response) => {
  try {
    const testId = String(req.params.testId);
    const test = TestRepository.getById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Feedback page not found or test does not exist' });
    }

    // Public view: Provide only information necessary for comparison, no simulated profile results
    const publicData = {
      testId: test.test.id,
      title: test.test.title,
      domain_id: test.test.domain_id,
      short_value_prop: test.offering.short_value_prop,
      description: test.offering.description,
      currency: test.offering.currency,
      options: {
        A: {
          name: test.options.A.name,
          price: test.options.A.price,
          primary_message: test.options.A.primary_message,
          served_markets: test.options.A.served_markets,
          fulfillment_mode: test.options.A.fulfillment_mode,
          images: test.options.A.images
        },
        B: {
          name: test.options.B.name,
          price: test.options.B.price,
          primary_message: test.options.B.primary_message,
          served_markets: test.options.B.served_markets,
          fulfillment_mode: test.options.B.fulfillment_mode,
          images: test.options.B.images
        }
      }
    };

    res.json(publicData);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load feedback details', message: error.message });
  }
});

// POST /api/feedback/:testId - Submit public human choice
feedbackRouter.post('/:testId', (req: Request, res: Response) => {
  try {
    const testId = String(req.params.testId);
    const parseResult = HumanResponseSubmissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid response submission',
        issues: parseResult.error.issues
      });
    }

    const test = TestRepository.getById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const response = TestRepository.recordHumanResponse(
      test.test.id,
      parseResult.data.choice,
      parseResult.data.reason,
      parseResult.data.token
    );

    res.status(201).json({ success: true, responseId: response.id });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record response', message: error.message });
  }
});

// GET /api/feedback/:testId/stats - Get human responses (separate from simulated profiles)
feedbackRouter.get('/:testId/stats', (req: Request, res: Response) => {
  try {
    const testId = String(req.params.testId);
    const stats = TestRepository.getHumanFeedback(testId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve feedback statistics', message: error.message });
  }
});
