import { Router, Request, Response } from 'express';
import { SignUpPayloadSchema, SignInPayloadSchema, DEMO_ACCOUNTS } from '@droptest/shared';
import { AuthRepository } from '../db/authRepository.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/authMiddleware.js';

export const authRouter = Router();

// POST /api/auth/signup - Create new account
authRouter.post('/signup', (req: Request, res: Response) => {
  try {
    const parseResult = SignUpPayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: parseResult.error.issues
      });
    }

    const user = AuthRepository.createUser(parseResult.data);
    const token = AuthRepository.createSession(user.id);

    // Set secure cookie
    res.cookie('session_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      user: AuthRepository.toPublicUser(user),
      token
    });
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to create account'
    });
  }
});

// POST /api/auth/signin - Sign in with credentials
authRouter.post('/signin', (req: Request, res: Response) => {
  try {
    const parseResult = SignInPayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Enter a valid email and password',
        issues: parseResult.error.issues
      });
    }

    const user = AuthRepository.getUserByEmail(parseResult.data.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = AuthRepository.verifyPassword(parseResult.data.password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = AuthRepository.createSession(user.id);

    res.cookie('session_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({
      user: AuthRepository.toPublicUser(user),
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Sign in failed. Please try again.' });
  }
});

// POST /api/auth/signout - End session
authRouter.post('/signout', (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.sessionToken) {
      AuthRepository.deleteSession(req.sessionToken);
    }
    res.clearCookie('session_token');
    res.json({ success: true, message: 'Signed out successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to sign out' });
  }
});

// GET /api/auth/me - Get current authenticated user
authRouter.get('/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  res.json({
    user: AuthRepository.toPublicUser(req.user)
  });
});

// GET /api/auth/demo-accounts - List available demo accounts for quick testing
authRouter.get('/demo-accounts', (_req: Request, res: Response) => {
  res.json({
    accounts: DEMO_ACCOUNTS.map((acc: any) => ({
      email: acc.email,
      password: acc.password,
      role: acc.role,
      display_name: acc.display_name,
      startup_name: acc.startup_name,
      description: acc.description || (acc.role === 'startup' ? acc.startup_name : acc.role === 'sponsor' ? 'Sponsor account' : 'Community member')
    }))
  });
});
