'use server';

import { moderateArgumentText as moderateArgumentTextFlow } from '@/ai/flows/moderate-argument-text';
import { generateDebateSummary as generateDebateSummaryFlow } from '@/ai/flows/generate-debate-summary';
import type { GenerateDebateSummaryInput } from '@/ai/flows/generate-debate-summary';
import { z } from 'zod';

const moderateSchema = z.object({
  text: z.string(),
});

export async function moderateArgumentText(input: { text: string }) {
  const validatedInput = moderateSchema.safeParse(input);
  if (!validatedInput.success) {
    return { isSafe: false, reason: 'Invalid input.' };
  }
  return moderateArgumentTextFlow(validatedInput.data);
}


export async function generateDebateSummary(input: GenerateDebateSummaryInput) {
    return generateDebateSummaryFlow(input);
}
