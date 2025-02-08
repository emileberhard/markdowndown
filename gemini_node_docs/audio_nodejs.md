Explore audio capabilities with the Gemini API
==============================================

Gemini can respond to prompts about audio. For example, Gemini can:

*   Describe, summarize, or answer questions about audio content.
*   Provide a transcription of the audio.
*   Provide answers or a transcription about a specific segment of the audio.

This guide demonstrates different ways to interact with audio files and audio content using the Gemini API.

Supported audio formats
-----------------------

Gemini supports the following audio format MIME types:

*   WAV - `audio/wav`
*   MP3 - `audio/mp3`
*   AIFF - `audio/aiff`
*   AAC - `audio/aac`
*   OGG Vorbis - `audio/ogg`
*   FLAC - `audio/flac`

### Technical details about audio

Gemini imposes the following rules on audio:

*   Gemini represents each second of audio as 25 tokens; for example, one minute of audio is represented as 1,500 tokens.
*   Gemini can only infer responses to English-language speech.
*   Gemini can "understand" non-speech components, such as birdsong or sirens.
*   The maximum supported length of audio data in a single prompt is 9.5 hours. Gemini doesn't limit the _number_ of audio files in a single prompt; however, the total combined length of all audio files in a single prompt cannot exceed 9.5 hours.
*   Gemini downsamples audio files to a 16 Kbps data resolution.
*   If the audio source contains multiple channels, Gemini combines those channels down to a single channel.

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

Make an audio file available to Gemini
--------------------------------------

You can make an audio file available to Gemini in either of the following ways:

*   [Upload](#upload-audio) the audio file _prior_ to making the prompt request.
*   Provide the audio file as [inline data](#inline-data) to the prompt request.

Upload an audio file and generate content
-----------------------------------------

You can use the File API to upload an audio file of any size. Always use the File API when the total request size (including the files, text prompt, system instructions, etc.) is larger than 20 MB.

Call [`media.upload`](https://ai.google.dev/api/rest/v1beta/media/upload) to upload a file using the File API. The following code uploads an audio file and then uses the file in a call to [`models.generateContent`](https://ai.google.dev/api/generate-content#method:-models.generatecontent).

// Make sure to include these imports:
    // import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
    // import { GoogleGenerativeAI } from "@google/generative-ai";
    const fileManager = new GoogleAIFileManager(process.env.API_KEY);
    
    const uploadResult = await fileManager.uploadFile(
      `${mediaPath}/samplesmall.mp3`,
      {
        mimeType: "audio/mp3",
        displayName: "Audio sample",
      },
    );
    
    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === FileState.PROCESSING) {
      process.stdout.write(".");
      // Sleep for 10 seconds
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      // Fetch the file from the API again
      file = await fileManager.getFile(uploadResult.file.name);
    }
    
    if (file.state === FileState.FAILED) {
      throw new Error("Audio processing failed.");
    }
    
    // View the response.
    console.log(
      `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`,
    );
    
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      "Tell me about this audio clip.",
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
    ]);
    console.log(result.response.text());files.js

You can verify the API successfully stored the uploaded file and get its metadata by calling [`files.get`](https://ai.google.dev/api/rest/v1beta/files/get).

// Make sure to include these imports:
    // import { GoogleAIFileManager } from "@google/generative-ai/server";
    const fileManager = new GoogleAIFileManager(process.env.API_KEY);
    
    const uploadResponse = await fileManager.uploadFile(
      `${mediaPath}/jetpack.jpg`,
      {
        mimeType: "image/jpeg",
        displayName: "Jetpack drawing",
      },
    );
    
    // Get the previously uploaded file's metadata.
    const getResponse = await fileManager.getFile(uploadResponse.file.name);
    
    // View the response.
    console.log(
      `Retrieved file ${getResponse.displayName} as ${getResponse.uri}`,
    );files.js

List uploaded files
-------------------

You can upload multiple audio files (and other kinds of files). The following code generates a list of all the files uploaded:

// Make sure to include these imports:
    // import { GoogleAIFileManager } from "@google/generative-ai/server";
    const fileManager = new GoogleAIFileManager(process.env.API_KEY);
    
    const listFilesResponse = await fileManager.listFiles();
    
    // View the response.
    for (const file of listFilesResponse.files) {
      console.log(`name: ${file.name} | display name: ${file.displayName}`);
    }files.js

Delete uploaded files
---------------------

Files are automatically deleted after 48 hours. Optionally, you can manually delete an uploaded file. For example:

// Make sure to include these imports:
    // import { GoogleAIFileManager } from "@google/generative-ai/server";
    const fileManager = new GoogleAIFileManager(process.env.API_KEY);
    
    const uploadResult = await fileManager.uploadFile(
      `${mediaPath}/jetpack.jpg`,
      {
        mimeType: "image/jpeg",
        displayName: "Jetpack drawing",
      },
    );
    
    // Delete the file.
    await fileManager.deleteFile(uploadResult.file.name);
    
    console.log(`Deleted ${uploadResult.file.displayName}`);files.js

Provide the audio file as inline data in the request
----------------------------------------------------

Instead of uploading an audio file, you can pass audio data in the same call that contains the prompt.

Then, pass that downloaded small audio file along with the prompt to Gemini:

const base64Buffer = fs.readFileSync(join(__dirname, "./samplesmall.mp3"));
    const base64AudioFile = base64Buffer.toString("base64");
    
    // Initialize a Gemini model appropriate for your use case.
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
    
    // Generate content using a prompt and the metadata of the uploaded file.
    const result = await model.generateContent([
        {
          inlineData: {
            mimeType: "audio/mp3",
            data: base64AudioFile
          }
        },
        { text: "Please summarize the audio." },
      ]);
    
    // Print the response.
    console.log(result.response.text())

Note the following about providing audio as inline data:

*   The maximum request size is 20 MB, which includes text prompts, system instructions, and files provided inline. If your file's size will make the _total request size_ exceed 20 MB, then [use the File API](#upload-audio) to upload files for use in requests.
*   If you're using an audio sample multiple times, it is more efficient to [use the File API](#upload-audio).

More ways to work with audio
----------------------------

This section provides a few additional ways to get more from audio.

### Get a transcript of the audio file

To get a transcript, just ask for it in the prompt. For example:

// To generate content, use this import path for GoogleGenerativeAI.
    // Note that this is a different import path than what you use for the File API.
    import { GoogleGenerativeAI } from "@google/generative-ai";
    
    // Initialize GoogleGenerativeAI with your API_KEY.
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    
    // Initialize a Gemini model appropriate for your use case.
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
    
    // Generate content using a prompt and the metadata of the uploaded file.
    const result = await model.generateContent([
        {
          fileData: {
            mimeType: audioFile.file.mimeType,
            fileUri: audioFile.file.uri
          }
        },
        { text: "Generate a transcript of the speech." },
      ]);
    
    // Print the response.
    console.log(result.response.text())

### Refer to timestamps in the audio file

A prompt can specify timestamps of the form `MM:SS` to refer to particular sections in an audio file. For example, the following prompt requests a transcript that:

*   Starts at 2 minutes 30 seconds from the beginning of the file.
*   Ends at 3 minutes 29 seconds from the beginning of the file.

// Create a prompt containing timestamps.
    const prompt = "Provide a transcript of the speech from 02:30 to 03:29."

### Count tokens

Call the [`countTokens`](https://ai.google.dev/api/rest/v1/models/countTokens) method to get a count of the number of tokens in the audio file. For example:

const countTokensResult = await model.countTokens({
       generateContentRequest: {
         contents: [
           {
             role: "user",
             parts: [
               {
                 fileData: {
                   mimeType: audioFile.file.mimeType,
                   fileUri: audioFile.file.uri,
                 },
               },
             ],
           },
         ],
       },
     });

What's next
-----------

This guide shows how to upload audio files using the File API and then generate text outputs from audio inputs. To learn more, see the following resources:

*   [File prompting strategies](https://ai.google.dev/gemini-api/docs/file-prompting-strategies): The Gemini API supports prompting with text, image, audio, and video data, also known as multimodal prompting.
*   [System instructions](https://ai.google.dev/gemini-api/docs/system-instructions): System instructions let you steer the behavior of the model based on your specific needs and use cases.
*   [Safety guidance](https://ai.google.dev/gemini-api/docs/safety-guidance): Sometimes generative AI models produce unexpected outputs, such as outputs that are inaccurate, biased, or offensive. Post-processing and human evaluation are essential to limit the risk of harm from such outputs.