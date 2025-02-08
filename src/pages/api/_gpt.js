import { GoogleGenerativeAI } from "@google/generative-ai";

// If you prefer storing your Gemini API key in, e.g., process.env.GOOGLE_API_KEY:
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "APIKEY_NOT_FOUND");

/**
 * Calls Gemini ("gemini-2.0-flash") with your `markdown` content plus `instructions` embedded
 * in a system prompt. Expects the model to return a JSON structure that includes
 *   { "changeList": [ { "originalText": "...", "changedTo": "..." } ] }
 * Then applies those text replacements.
 */
export async function runGPT(_unusedModel, markdown, instructions) {
  // Even if you pass a model name in _unusedModel, we always use gemini-2.0-flash below.
  const systemPrompt = `
  You are a helpful assistant reformat, clean, edit the markdown content. Below are the instructions to follow:
  ${instructions}
  
  Apply the instructions on user-provided markdown below and provide the array of string replacement operations required.
  The JSON format: { "changeList": [ { "originalText": "SOMETHING", "changedTo": "NEW TEXT" } ] }
  MAKE SURE THE "originalText" PART IS EXACTLY AS IT APPEARS IN THE MARKDOWN.
  `;

  // Start the model
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  // Provide the system instructions + user content
  const messages = [
    { role: "system", text: systemPrompt },
    { role: "user", text: markdown },
  ];

  try {
    // Generate text (which we want to be valid JSON).
    const result = await model.generateContent(messages);
    const rawResponse = result.response.text();

    // Attempt to parse the JSON from the model's output
    let parsed;
    try {
      parsed = JSON.parse(rawResponse);
    } catch (err) {
      console.error("Could not parse model output as JSON:", rawResponse);
      throw err;
    }

    const changeList = parsed.changeList || [];
    let output = markdown;
    for (const change of changeList) {
      // Simple find & replace
      output = output.replace(change.originalText, change.changedTo);
    }

    return { content: output, changes: changeList };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}
