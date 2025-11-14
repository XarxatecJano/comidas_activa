import dotenv from 'dotenv';

dotenv.config();

export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  model: 'gpt-4',
  maxTokens: 2000,
  temperature: 0.7,
};

// Validar que la API key esté configurada
if (!openaiConfig.apiKey) {
  console.warn('⚠ OPENAI_API_KEY not configured in .env file');
}

export default openaiConfig;
