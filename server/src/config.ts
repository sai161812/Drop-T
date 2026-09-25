import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  dataDir: string;
  uploadDir: string;
  groqApiKey: string;
  groqModel: string;
  groqVisionModel: string;
  groqTemperature: number;
  groqMaxRetries: number;
}

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dataDir: path.resolve(process.cwd(), process.env.DATA_DIR || './data'),
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads'),
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  groqVisionModel: process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview',
  groqTemperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.2'),
  groqMaxRetries: parseInt(process.env.GROQ_MAX_RETRIES || '3', 10),
};
