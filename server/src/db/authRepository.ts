import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database.js';
import { User, PublicUser, SignUpPayload, UserRole } from '@droptest/shared';

export class AuthRepository {
  /**
   * Hash password securely with unique salt using scrypt
   */
  static hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify password against stored salt:hash
   */
  static verifyPassword(password: string, storedHash: string): boolean {
    try {
      const [salt, hash] = storedHash.split(':');
      if (!salt || !hash) return false;
      const computedHash = scryptSync(password, salt, 64).toString('hex');
      return timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hash, 'hex'));
    } catch {
      return false;
    }
  }

  /**
   * Convert User to PublicUser (excluding password_hash)
   */
  static toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      display_name: user.display_name,
      startup_name: user.startup_name,
      startup_description: user.startup_description
    };
  }

  /**
   * Create a new user
   */
  static createUser(payload: SignUpPayload): User {
    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM users WHERE lower(email) = lower(?)').get(payload.email);
    if (existing) {
      throw Object.assign(new Error('An account with this email already exists.'), { status: 409 });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const passwordHash = this.hashPassword(payload.password);

    const stmt = db.prepare(`
      INSERT INTO users (
        id, email, password_hash, role, display_name, startup_name, startup_description, created_at, updated_at
      )
      VALUES (?, lower(?), ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      payload.email.trim(),
      passwordHash,
      payload.role,
      payload.display_name.trim(),
      payload.role === 'startup' ? (payload.startup_name?.trim() || null) : null,
      payload.role === 'startup' ? (payload.startup_description?.trim() || null) : null,
      now,
      now
    );

    return this.getUserById(id)!;
  }

  /**
   * Get user by email
   */
  static getUserByEmail(email: string): (User & { password_hash: string }) | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').get(email.trim()) as any;
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      password_hash: row.password_hash,
      role: row.role as UserRole,
      display_name: row.display_name,
      startup_name: row.startup_name || undefined,
      startup_description: row.startup_description || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Get user by ID
   */
  static getUserById(id: string): User | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      role: row.role as UserRole,
      display_name: row.display_name,
      startup_name: row.startup_name || undefined,
      startup_description: row.startup_description || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Create a session for a user (valid for 30 days)
   */
  static createSession(userId: string): string {
    const db = getDatabase();
    const token = randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const stmt = db.prepare(`
      INSERT INTO sessions (token, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(token, userId, expiresAt, now.toISOString());

    return token;
  }

  /**
   * Validate session token and retrieve user
   */
  static getUserBySessionToken(token: string): User | null {
    if (!token || typeof token !== 'string') return null;
    const db = getDatabase();
    const sessionRow = db.prepare(`
      SELECT user_id, expires_at 
      FROM sessions 
      WHERE token = ?
    `).get(token) as { user_id: string; expires_at: string } | undefined;

    if (!sessionRow) return null;

    if (new Date(sessionRow.expires_at) <= new Date()) {
      // Session expired, clean up
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return null;
    }

    return this.getUserById(sessionRow.user_id);
  }

  /**
   * Delete session token (Sign out)
   */
  static deleteSession(token: string): boolean {
    const db = getDatabase();
    const res = db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return res.changes > 0;
  }
}
