Function calling tutorial
=========================

Function calling makes it easier for you to get structured data outputs from generative models. You can then use these outputs to call other APIs and return the relevant response data to the model. In other words, function calling helps you connect generative models to external systems so that the generated content includes the most up-to-date and accurate information.

You can provide Gemini models with descriptions of functions. These are functions that you write in the language of your app (that is, they're not Google Cloud Functions). The model may ask you to call a function and send back the result to help the model handle your query.

If you haven't already, check out the [Introduction to function calling](https://ai.google.dev/gemini-api/docs/function-calling) to learn more.

Example API for lighting control
--------------------------------

Imagine you have a basic lighting control system with an application programming interface (API) and you want to allow users to control the lights through simple text requests. You can use the Function Calling feature to interpret lighting change requests from users and translate them into API calls to set the lighting values. This hypothetical lighting control system lets you control the brightness of the light and its color temperature, defined as two separate parameters:

Parameter

Type

Required

Description

`brightness`

number

yes

Light level from 0 to 100. Zero is off and 100 is full brightness.

`colorTemperature`

string

yes

Color temperature of the light fixture which can be `daylight`, `cool` or `warm`.

For simplicity, this imaginary lighting system only has one light, so the user does not have to specify a room or location. Here is an example JSON request you could send to the lighting control API to change the light level to 50% using the daylight color temperature:

{
      "brightness": "50",
      "colorTemperature": "daylight"
    }

This tutorial shows you how to set up a Function Call for the Gemini API to interpret users lighting requests and map them to API settings to control a light's brightness and color temperature values.

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

Define an API function
----------------------

Create a function that makes an API request. This function should be defined within the code of your application, but could call services or APIs outside of your application. The Gemini API does _not_ call this function directly, so you can control how and when this function is executed through your application code. For demonstration purposes, this tutorial defines a mock API function that just returns the requested lighting values:

async function setLightValues(brightness, colorTemp) {
      // This mock API returns the requested lighting values
      return {
        brightness: brightness,
        colorTemperature: colorTemp
      };
    }

Create function declarations
----------------------------

Create the function declaration that you'll pass to the generative model. When you declare a function for use by the model, you should include as much detail as possible in the function and parameter descriptions. The generative model uses this information to determine which function to select and how to provide values for the parameters in the function call. The following code shows how to declare the lighting control function:

const controlLightFunctionDeclaration = {
      name: "controlLight",
      parameters: {
        type: "OBJECT",
        description: "Set the brightness and color temperature of a room light.",
        properties: {
          brightness: {
            type: "NUMBER",
            description: "Light level from 0 to 100. Zero is off and 100 is full brightness.",
          },
          colorTemperature: {
            type: "STRING",
            description: "Color temperature of the light fixture which can be `daylight`, `cool` or `warm`.",
          },
        },
        required: ["brightness", "colorTemperature"],
      },
    };
    
    // Executable function code. Put it in a map keyed by the function name
    // so that you can call it once you get the name string from the model.
    const functions = {
      controlLight: ({ brightness, colorTemperature }) => {
        return setLightValues( brightness, colorTemperature)
      }
    };

Declare functions during model initialization
---------------------------------------------

When you want to use function calling with a model, you must provide your function declarations when you initialize the model object. You declare functions by setting the model's `tools` parameter:

const { GoogleGenerativeAI } = require("@google/generative-ai");
    
    // Access your API key as an environment variable (see "Set up your API key" above)
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    
    // ...
    
    const generativeModel = genAI.getGenerativeModel({
      // Use a model that supports function calling, like a Gemini 1.5 model
      model: "gemini-2.0-flash",
    
      // Specify the function declaration.
      tools: {
        functionDeclarations: [controlLightFunctionDeclaration],
      },
    });

Generate a function call
------------------------

Once you have initialized the model with your function declarations, you can prompt the model with the defined function. You should use function calling using chat prompting (`sendMessage()`), since function calling generally benefits from having the context of previous prompts and responses.

const chat = generativeModel.startChat();
    const prompt = "Dim the lights so the room feels cozy and warm.";
    
    // Send the message to the model.
    const result = await chat.sendMessage(prompt);
    
    // For simplicity, this uses the first function call found.
    const call = result.response.functionCalls()[0];
    
    if (call) {
      // Call the executable function named in the function call
      // with the arguments specified in the function call and
      // let it call the hypothetical API.
      const apiResponse = await functions[call.name](call.args);
    
      // Send the API response back to the model so it can generate
      // a text response that can be displayed to the user.
      const result2 = await chat.sendMessage([{functionResponse: {
        name: 'controlLight',
        response: apiResponse
      }}]);
    
      // Log the text response.
      console.log(result2.response.text());
    }