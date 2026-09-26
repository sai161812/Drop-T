import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

async function testLimits() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const list = await groq.models.list();
  console.log('All available models:');
  for (const m of list.data) {
    console.log(`- ${m.id}`);
  }
}
testLimits();
