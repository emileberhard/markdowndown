Generate structured output with the Gemini API
==============================================

Gemini generates unstructured text by default, but some applications require structured text. For these use cases, you can constrain Gemini to respond with JSON, a structured data format suitable for automated processing. You can also constrain the model to respond with one of the options specified in an enum.

Here are a few use cases that might require structured output from the model:

*   Build a database of companies by pulling company information out of newspaper articles.
*   Pull standardized information out of resumes.
*   Extract ingredients from recipes and display a link to a grocery website for each ingredient.

In your prompt, you can ask Gemini to produce JSON-formatted output, but note that the model is not guaranteed to produce JSON and nothing but JSON. For a more deterministic response, you can pass a specific JSON schema in a [`responseSchema`](https://ai.google.dev/api/rest/v1beta/GenerationConfig#FIELDS.response_schema) field so that Gemini always responds with an expected structure.

This guide shows you how to generate JSON using the [`generateContent`](https://ai.google.dev/api/rest/v1/models/generateContent) method through the SDK of your choice or using the REST API directly. The examples show text-only input, although Gemini can also produce JSON responses to multimodal requests that include [images](https://ai.google.dev/gemini-api/docs/vision), [videos](https://ai.google.dev/gemini-api/docs/vision), and [audio](https://ai.google.dev/gemini-api/docs/audio).

Before you begin: Set up your project and API key
-------------------------------------------------

Before calling the Gemini API, you need to set up your project and configure your API key.

**Expand to view how to set up your project and API key**

### Get and secure your API key

You need an API key to call the Gemini API. If you don't already have one, create a key in Google AI Studio.

[Get an API key](https://aistudio.google.com/app/apikey)

It's strongly recommended that you do _not_ check an API key into your version control system.

You should store your API key in a secrets store such as Google Cloud [Secret Manager](https://cloud.google.com/secret-manager/docs).

This tutorial assumes that you're accessing your API key as an environment variable.

### Install the SDK package and configure your API key

In your application, do the following:

1.  Install the `GoogleGenerativeAI` package for Node.js:
    
    npm install @google/generative-ai
    
2.  Import the package and configure the service with your API key:
    
    const { GoogleGenerativeAI } = require("@google/generative-ai");
        
        // Access your API key as an environment variable
        const genAI = new GoogleGenerativeAI(process.env.API_KEY);

Generate JSON
-------------

When the model is configured to output JSON, it responds to any prompt with JSON-formatted output.

You can control the structure of the JSON response by supplying a schema. There are two ways to supply a schema to the model:

*   As text in the prompt
*   As a structured schema supplied through model configuration

Both approaches work in both Gemini 1.5 Flash and Gemini 1.5 Pro.

### Supply a schema as text in the prompt

The following example prompts the model to return cookie recipes in a specific JSON format.

Since the model gets the format specification from text in the prompt, you may have some flexibility in how you represent the specification. Any reasonable format for representing a JSON schema may work.

// Make sure to include these imports:
    // import { GoogleGenerativeAI } from "@google/generative-ai";
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
    
    const prompt = `List a few popular cookie recipes using this JSON schema:
    
    Recipe = {'recipeName': string}
    Return: Array<Recipe>`;
    
    const result = await model.generateContent(prompt);
    console.log(result.response.text());controlled_generation.js

The output might look like this:

\[{"recipeName": "Chocolate Chip Cookies"}, {"recipeName": "Oatmeal Raisin Cookies"}, {"recipeName": "Snickerdoodles"}, {"recipeName": "Sugar Cookies"}, {"recipeName": "Peanut Butter Cookies"}\]

### Supply a schema through model configuration

The following example does the following:

1.  Instantiates a model configured through a schema to respond with JSON.
2.  Prompts the model to return cookie recipes.

// Make sure to include these imports:
    // import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    
    const schema = {
      description: "List of recipes",
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          recipeName: {
            type: SchemaType.STRING,
            description: "Name of the recipe",
            nullable: false,
          },
        },
        required: ["recipeName"],
      },
    };
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    const result = await model.generateContent(
      "List a few popular cookie recipes.",
    );
    console.log(result.response.text());controlled_generation.js

The output might look like this:

\[{"recipeName": "Chocolate Chip Cookies"}, {"recipeName": "Oatmeal Raisin Cookies"}, {"recipeName": "Snickerdoodles"}, {"recipeName": "Sugar Cookies"}, {"recipeName": "Peanut Butter Cookies"}\]