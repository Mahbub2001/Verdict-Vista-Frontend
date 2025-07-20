'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDebateSummaryInputSchema = z.object({
  topic: z.string().describe('The topic of the debate.'),
  supportArguments: z.array(z.string()).describe('Arguments in support of the topic.'),
  opposeArguments: z.array(z.string()).describe('Arguments in opposition to the topic.'),
  winningSide: z.enum(['support', 'oppose']).describe('The side that won the debate.'),
});
export type GenerateDebateSummaryInput = z.infer<typeof GenerateDebateSummaryInputSchema>;

const GenerateDebateSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the debate, including key arguments and the outcome.'),
});
export type GenerateDebateSummaryOutput = z.infer<typeof GenerateDebateSummaryOutputSchema>;

export async function generateDebateSummary(input: GenerateDebateSummaryInput): Promise<GenerateDebateSummaryOutput> {
  return generateDebateSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDebateSummaryPrompt',
  input: {schema: GenerateDebateSummaryInputSchema},
  output: {schema: GenerateDebateSummaryOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing debates.

  Topic: {{{topic}}}

  Support Arguments:
  {{#each supportArguments}}
  - {{{this}}}
  {{/each}}

  Oppose Arguments:
  {{#each opposeArguments}}
  - {{{this}}}
  {{/each}}

  Winning Side: {{{winningSide}}}

  Generate a concise summary of the debate, highlighting the main arguments from both sides and clearly stating the outcome.
  The summary should be no more than 200 words.
  `,
});

const generateDebateSummaryFlow = ai.defineFlow(
  {
    name: 'generateDebateSummaryFlow',
    inputSchema: GenerateDebateSummaryInputSchema,
    outputSchema: GenerateDebateSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
