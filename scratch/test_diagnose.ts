import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const key = process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY;
  console.log('Testing Key:', key?.slice(0, 10));
  const groq = new Groq({ apiKey: key });
  try {
    const list = await groq.models.list();
    console.log('Models listed successfully. Count:', list.data.length);
    for (const m of list.data.slice(0, 5)) {
      console.log(`- ${m.id}`);
    }
  } catch (err: any) {
    console.error('Error details:', err.message, err.cause, err.status);
  }
}
test();
