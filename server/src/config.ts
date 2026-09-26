import path from 'node:path';
import dotenv from 'dotenv';

const baseDir = typeof import.meta.dirname === 'string' ? import.meta.dirname : process.cwd();
dotenv.config();
dotenv.config({ path: path.resolve(baseDir, '../../.env') });
dotenv.config({ path: path.resolve(baseDir, '../.env') });

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  dataDir: string;
  uploadDir: string;
  groqApiKey: string;
  groqApiKeys: string[];
  groqModel: string;
  groqTemperature: number;
  groqMaxRetries: number;
  braveSearchApiKey: string;
  tavilyApiKey: string;
  serperApiKey: string;
}

function parseGroqApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.GROQ_API_KEYS) {
    keys.push(...process.env.GROQ_API_KEYS.split(','));
  }
  for (const envKey of ['GROQ_API_KEY', 'GROQ_API_KEY_1', 'GROQ_API_KEY_2', 'GROQ_API_KEY_3', 'GROQ_API_KEY_4', 'GROQ_API_KEY_5']) {
    if (process.env[envKey]) {
      keys.push(process.env[envKey]!);
    }
  }
  return Array.from(new Set(keys.map(k => k.trim()).filter(k => k.length > 0)));
}

const parsedGroqKeys = parseGroqApiKeys();

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dataDir: path.resolve(process.cwd(), process.env.DATA_DIR || './data'),
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads'),
  groqApiKey: parsedGroqKeys[0] || process.env.GROQ_API_KEY || '',
  groqApiKeys: parsedGroqKeys,
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  groqTemperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.2'),
  groqMaxRetries: parseInt(process.env.GROQ_MAX_RETRIES || '5', 10),
  braveSearchApiKey: process.env.BRAVE_SEARCH_API_KEY || '',
  tavilyApiKey: process.env.TAVILY_API_KEY || '',
  serperApiKey: process.env.SERPER_API_KEY || '',
};
