import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

// Key pool manager
class GroqKeyPool {
  private keys: string[] = [];
  private cooldowns: Map<string, number> = new Map();
  private currentIndex = 0;

  constructor(keys: string[]) {
    this.keys = keys.filter(k => k && k.trim().length > 0);
  }

  get availableKeysCount(): number {
    return this.keys.length;
  }

  getKey(): { key: string; index: number } | null {
    if (this.keys.length === 0) return null;
    const now = Date.now();
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length;
      const k = this.keys[idx];
      const cd = this.cooldowns.get(k) || 0;
      if (now >= cd) {
        this.currentIndex = (idx + 1) % this.keys.length;
        return { key: k, index: idx };
      }
    }
    return null;
  }

  markCooldown(key: string, durationMs: number) {
    console.log(`[KeyPool] Marking key ...${key.slice(-6)} in cooldown for ${Math.round(durationMs / 1000)}s`);
    this.cooldowns.set(key, Date.now() + durationMs);
  }

  getShortestCooldownWaitMs(): number {
    const now = Date.now();
    let minWait = 10000;
    for (const [_, cd] of this.cooldowns.entries()) {
      const wait = cd - now;
      if (wait > 0 && wait < minWait) minWait = wait;
    }
    return Math.max(1000, minWait);
  }
}

async function test() {
  const rawKeys = [
    process.env.GROQ_API_KEY || '',
    process.env.GROQ_API_KEY_2 || '',
    ...(process.env.GROQ_API_KEYS || '').split(',')
  ].map(k => k.trim()).filter(Boolean);

  const pool = new GroqKeyPool(rawKeys);
  console.log(`Initialized key pool with ${pool.availableKeysCount} unique key(s).`);

  const keyInfo = pool.getKey();
  if (!keyInfo) {
    console.error('No keys available!');
    return;
  }
  console.log(`Using key index ${keyInfo.index} (...${keyInfo.key.slice(-6)})`);

  const groq = new Groq({ apiKey: keyInfo.key });
  const models = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
  for (const model of models) {
    const start = Date.now();
    try {
      const res = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'Say hello in 1 word' }],
        max_completion_tokens: 20
      });
      console.log(`[PASS] Model ${model} took ${Date.now() - start}ms: ${res.choices[0]?.message?.content}`);
    } catch (e: any) {
      console.log(`[FAIL] Model ${model}: ${e.message}`);
    }
  }
}

test();
