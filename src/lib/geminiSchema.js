import { toGeminiSchema } from 'gemini-zod';
import { rawHtmlZodSchema } from './htmlToMarkdownSchema.js';

export const rawHtmlGeminiSchema = toGeminiSchema(rawHtmlZodSchema); 