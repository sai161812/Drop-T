import { Router, Request, Response } from 'express';
import { TestDraftPayloadSchema } from '@droptest/shared';
import { TestRepository } from '../db/testRepository.js';

export const testRouter = Router();

// GET /api/tests - List all tests
testRouter.get('/', (_req: Request, res: Response) => {
  try {
    const tests = TestRepository.listAll();
    res.json({ tests });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list tests', message: error.message });
  }
});

// GET /api/tests/:id - Get test by ID
testRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const testId = String(req.params.id);
    const test = TestRepository.getById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json(test);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve test', message: error.message });
  }
});

// POST /api/tests - Create or save test draft
testRouter.post('/', (req: Request, res: Response) => {
  try {
    const parseResult = TestDraftPayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: parseResult.error.issues
      });
    }

    const saved = TestRepository.saveDraft(parseResult.data);
    res.status(200).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save test draft', message: error.message });
  }
});
