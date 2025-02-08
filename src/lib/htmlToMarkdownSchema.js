import { z } from 'zod';

export const rawHtmlZodSchema = z.object({
  page_title: z.string(),
  markdown_body: z.string(),
}); 