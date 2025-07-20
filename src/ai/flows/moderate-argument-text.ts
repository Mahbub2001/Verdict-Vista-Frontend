'use server';


import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateArgumentTextInputSchema = z.object({
  text: z.string().describe('The argument text to moderate.'),
});
export type ModerateArgumentTextInput = z.infer<
  typeof ModerateArgumentTextInputSchema
>;

const ModerateArgumentTextOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether the argument text is safe or not.'),
  reason: z.string().describe('The reason why the argument text is not safe.'),
});
export type ModerateArgumentTextOutput = z.infer<
  typeof ModerateArgumentTextOutputSchema
>;

export async function moderateArgumentText(
  input: ModerateArgumentTextInput
): Promise<ModerateArgumentTextOutput> {
  return moderateArgumentTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateArgumentTextPrompt',
  input: {schema: ModerateArgumentTextInputSchema},
  output: {schema: ModerateArgumentTextOutputSchema},
  prompt: `You are an AI content moderator. Your task is to determine if the following text is safe for use on a public debate platform.

Text: {{{text}}}

Here is a list of banned words: stupid, idiot, dumb.

Determine if the text contains any of these words or any other inappropriate language. If it does, set isSafe to false and provide a reason. Otherwise, set isSafe to true.

Respond in JSON format.`,
});

const moderateArgumentTextFlow = ai.defineFlow(
  {
    name: 'moderateArgumentTextFlow',
    inputSchema: ModerateArgumentTextInputSchema,
    outputSchema: ModerateArgumentTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
