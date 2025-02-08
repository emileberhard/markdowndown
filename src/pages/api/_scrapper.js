// Import the necessary modules using ES6 import syntax
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import { processMarkdownWithImages } from './_imgProcessor';
import fs from 'fs';
import { runGPT } from './_gpt';
import Showdown from 'showdown';
import puppeteer from 'puppeteer';
import { wrapInStyledHtml } from './_htmlwrap';
import { GoogleGenerativeAI } from '@google/generative-ai'
import { rawHtmlGeminiSchema } from '@/lib/geminiSchema'
const browserFetchUrl = process.env.HTMLFETCH_API?`${process.env.HTMLFETCH_API}/?url=`:undefined;
const browserWSEndpoint = process.env.BROWSERLESS_KEY? `https://chrome.browserless.io?token=${process.env.BROWSERLESS_KEY}`:undefined;

// Define the function using ES6 arrow function syntax
let browser;
const fetchCleanMarkdownFromUrl = async (
  url,
  filePath,
  fetchImages = false,
  imgDirName = "images",
  imagesBasePathOverride = undefined,
  removeNonContent = true,
  applyGpt = "",
  bigModel = false,
  geminiRawHtmlMode = false
) => {
  try {
    let data;
    if (browserFetchUrl){
      // fetch from remote
      console.log('Fetching from remote...');
      const resp = await fetch(`${browserFetchUrl}${url}`);
      if (!resp.ok){
        throw new Error(`Failed to fetch ${url}`);
      }
      data = await resp.text();
    }
    else{
      console.log('Launching Puppeteer browser instance...');
      if (!browser){
        if (browserWSEndpoint){
          browser = await puppeteer.connect({browserWSEndpoint});
        }
        else{
          browser = await puppeteer.launch();
        }
      }

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Get the page content
      console.log('Fetching page content...');
      data = await page.content();

      browser.close();
      browser = null;
    }
    
    if (geminiRawHtmlMode) {
      console.log("Running Gemini 2.0 raw HTML -> Markdown mode...");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "MISSING_KEY");
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: "You are a HTML to markdown formatter. You take raw HTML from a web page and output beautifully formatted markdown articles. The markdown content should be the exact same content as the article or website text, but beautifully formatted with markdown.",
      });

      const generationConfig = {
        responseMimeType: "application/json",
        responseSchema: rawHtmlGeminiSchema,
        temperature: 0.5,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192
      };

      const chat = model.startChat({ generationConfig });
      const response = await chat.sendMessage(data);

      const textOutput = response.response.text();
      let parsed;
      try {
        parsed = JSON.parse(textOutput);
      } catch (err) {
        console.error("Gemini 2.0 raw HTML mode: Could not parse JSON from model:", textOutput);
        throw err;
      }

      const theMarkdown = parsed.markdown_body || "";
      fs.writeFileSync(filePath, theMarkdown, "utf8");

      return theMarkdown;
    }

    // Use JSDOM to parse the HTML content
    const doc = new JSDOM(data, { url });

    // Use Readability to extract the main content of the page
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    // Convert the main content HTML to Markdown
    const turndownService = new TurndownService();
    let markdown = turndownService.turndown(removeNonContent?`<h1>${article.title}</h1>${article.content}`:data);
    
    fs.writeFileSync(filePath, markdown, 'utf8');
    if (!fetchImages){
      return markdown;
    }
    
    // move images to local
    console.log("Moving images to local...");
    await processMarkdownWithImages(filePath, imgDirName, imagesBasePathOverride);
    // Apply GPT if requested
    if (applyGpt){
      const curMarkdown = fs.readFileSync(filePath, "utf8");
      console.log("Applying GPT...");
      const instructions = applyGpt;
      // We can pass null for model; "gemini-2.0-flash" is used in runGPT by default
      const gptResponse = await runGPT(null, curMarkdown, instructions);
      markdown = gptResponse.content || markdown;
      fs.writeFileSync(filePath, markdown, 'utf8');
    }

    // also save the markdown to html
    const converter = new Showdown.Converter();
    const html = converter.makeHtml(markdown);
    fs.writeFileSync(filePath.replace(".md", ".html"), wrapInStyledHtml(html), 'utf8');
  } catch (error) {
    console.error(`Error fetching clean markdown from URL: ${error.message}`);
    throw error;
    browser.close();
    browser = null;
  }
};

// Export the function as a default export
export default fetchCleanMarkdownFromUrl;
