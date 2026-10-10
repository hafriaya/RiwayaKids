const { generateText } = require('ai');
const { google } = require('@ai-sdk/google');

async function main() {
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-001',
    'gemini-1.5-flash-002',
    'gemini-flash-latest'
  ];

  console.log("Testing Models against Google SDK...");
  for (const modelId of models) {
    try {
      const { text } = await generateText({
        model: google(modelId),
        prompt: 'Say the exact word "hello".',
        maxRetries: 0
      });
      console.log(`✅ SUCCESS: ${modelId}`);
    } catch (e) {
      console.log(`❌ FAILED: ${modelId} - ${e.message}`);
    }
  }
}
main();
