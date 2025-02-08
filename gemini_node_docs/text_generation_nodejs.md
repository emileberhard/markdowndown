Text generation
===============

The Gemini API can generate text output when provided text, images, video, and audio as input.

This guide shows you how to generate text using the [`generateContent`](https://ai.google.dev/api/rest/v1/models/generateContent) and [`streamGenerateContent`](https://ai.google.dev/api/rest/v1/models/streamGenerateContent) methods. To learn about working with Gemini's vision and audio capabilities, refer to the [Vision](https://ai.google.dev/gemini-api/docs/vision) and [Audio](https://ai.google.dev/gemini-api/docs/audio) guides.

Generate text from text-only input
----------------------------------

The simplest way to generate text using the Gemini API is to provide the model with a single text-only input, as shown in this example:

import { GoogleGenerativeAI } from "@google/generative-ai";
    const genAI = new GoogleGenerativeAI("GEMINI_API_KEY");
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = "Explain how AI works";
    
    const result = await model.generateContent(prompt);
    console.log(result.response.text());

In this case, the prompt ("Explain how AI works") doesn't include any output examples, system instructions, or formatting information. It's a [zero-shot](https://ai.google.dev/gemini-api/docs/models/generative-models#zero-shot-prompts) approach. For some use cases, a [one-shot](https://ai.google.dev/gemini-api/docs/models/generative-models#one-shot-prompts) or [few-shot](https://ai.google.dev/gemini-api/docs/models/generative-models#few-shot-prompts) prompt might produce output that's more aligned with user expectations. In some cases, you might also want to provide [system instructions](https://ai.google.dev/gemini-api/docs/text-generation#system-instructions) to help the model understand the task or follow specific guidelines.

Generate text from text-and-image input
---------------------------------------

The Gemini API supports multimodal inputs that combine text with media files. The following example shows how to generate text from text-and-image input:

import { GoogleGenerativeAI } from "@google/generative-ai";
    import * as fs from 'node:fs';
    
    const genAI = new GoogleGenerativeAI("GEMINI_API_KEY");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    function fileToGenerativePart(path, mimeType) {
      return {
        inlineData: {
          data: Buffer.from(fs.readFileSync(path)).toString("base64"),
          mimeType,
        },
      };
    }
    
    const prompt = "Describe how this product might be manufactured.";
    const imagePart = fileToGenerativePart("/path/to/image.png", "image/png");
    
    const result = await model.generateContent([prompt, imagePart]);
    console.log(result.response.text());

Generate a text stream
----------------------

By default, the model returns a response after completing the entire text generation process. You can achieve faster interactions by not waiting for the entire result, and instead use streaming to handle partial results.

The following example shows how to implement streaming using the [`streamGenerateContent`](https://ai.google.dev/api/rest/v1/models/streamGenerateContent) method to generate text from a text-only input prompt.

import { GoogleGenerativeAI } from "@google/generative-ai";
    const genAI = new GoogleGenerativeAI("GEMINI_API_KEY");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = "Explain how AI works";
    
    const result = await model.generateContentStream(prompt);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      process.stdout.write(chunkText);
    }

Create a chat conversation
--------------------------

The Gemini SDK lets you collect multiple rounds of questions and responses, allowing users to step incrementally toward answers or get help with multipart problems. This SDK feature provides an interface to keep track of conversations history, but behind the scenes uses the same `generateContent` method to create the response.

The following code example shows a basic chat implementation:

import { GoogleGenerativeAI } from "@google/generative-ai";
    const genAI = new GoogleGenerativeAI("GEMINI_API_KEY");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Hello" }],
        },
        {
          role: "model",
          parts: [{ text: "Great to meet you. What would you like to know?" }],
        },
      ],
    });
    
    let result = await chat.sendMessage("I have 2 dogs in my house.");
    console.log(result.response.text());
    let result2 = await chat.sendMessage("How many paws are in my house?");
    console.log(result2.response.text());

You can also use streaming with chat, as shown in the following example:

import { GoogleGenerativeAI } from "@google/generative-ai";
    const genAI = new GoogleGenerativeAI("GEMINI_API_KEY");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Hello" }],
        },
        {
          role: "model",
          parts: [{ text: "Great to meet you. What would you like to know?" }],
        },
      ],
    });
    
    let result = await chat.sendMessageStream("I have 2 dogs in my house.");
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      process.stdout.write(chunkText);
    }
    let result2 = await chat.sendMessageStream("How many paws are in my house?");
    for await (const chunk of result2.stream) {
      const chunkText = chunk.text();
      process.stdout.write(chunkText);
    }

Configure text generation
-------------------------

Every prompt you send to the model includes parameters that control how the model generates responses. You can use [`GenerationConfig`](https://ai.google.dev/api/rest/v1/GenerationConfig) to configure these parameters. If you don't configure the parameters, the model uses default options, which can vary by model.

The following example shows how to configure several of the available options.

import { GoogleGenerativeAI } from "@google/generative-ai";
    const genAI = new GoogleGenerativeAI("GEMINI_API_KEY");
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent({
        contents: [
            {
              role: 'user',
              parts: [
                {
                  text: "Explain how AI works",
                }
              ],
            }
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.1,
        }
    });
    
    console.log(result.response.text());

Add system instructions
-----------------------

System instructions let you steer the behavior of a model based on your specific needs and use cases.

By giving the model system instructions, you provide the model additional context to understand the task, generate more customized responses, and adhere to specific guidelines over the full user interaction with the model. You can also specify product-level behavior by setting system instructions, separate from prompts provided by end users.

You can set system instructions when you initialize your model:

// Set the system instruction during model initialization
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "You are a cat. Your name is Neko.",
    });

Then, you can send requests to the model as usual.

What's next
-----------

Now that you have explored the basics of the Gemini API, you might want to try:

*   [Vision understanding](https://ai.google.dev/gemini-api/docs/vision): Learn how to use Gemini's native vision understanding to process images and videos.
*   [Audio understanding](https://ai.google.dev/gemini-api/docs/audio): Learn how to use Gemini's native audio understanding to process audio files.