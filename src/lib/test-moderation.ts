import {
  moderateText,
  getModerationErrorMessage,
  sanitizeText,
  isTextClean,
} from "./moderation";

const testCases = [
  "This is a normal debate argument about climate change.",
  "You are stupid if you believe that.",
  "This policy is damn ridiculous and makes no sense.",
  "I think this is a great idea that could help everyone.",
  "That's the most idiotic thing I've ever heard, you moron.",
  "Climate change deniers are complete idiots and should shut up.",
  "Your argument has some valid points but I disagree.",
  "This is fucking ridiculous and makes no damn sense at all.",
];

console.log("=== Moderation System Test Results ===\n");

testCases.forEach((text, index) => {
  console.log(`Test ${index + 1}: "${text}"`);

  const result = moderateText(text);
  console.log(`  Clean: ${result.isClean}`);
  console.log(`  Severity: ${result.severity}`);

  if (result.bannedWords.length > 0) {
    console.log(`  Banned words found: ${result.bannedWords.join(", ")}`);
  }

  if (result.contextualWords.length > 0) {
    console.log(
      `  Contextual words found: ${result.contextualWords.join(", ")}`
    );
  }

  if (!result.isClean) {
    console.log(`  Error message: ${getModerationErrorMessage(result)}`);
    console.log(`  Sanitized: "${sanitizeText(text)}"`);
  }

  console.log("");
});

console.log("=== Quick Test Function ===");
console.log('isTextClean("Hello world"): ', isTextClean("Hello world"));
console.log('isTextClean("You are stupid"): ', isTextClean("You are stupid"));
console.log(
  'isTextClean("This is fucking ridiculous"): ',
  isTextClean("This is fucking ridiculous")
);
