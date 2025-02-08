// /Users/emil/playground/markdowndown/src/pages/api/_scrapper.js

import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import { processMarkdownWithImages } from './_imgProcessor';
import fs from 'fs';
import { runGPT } from './_gpt';
import Showdown from 'showdown';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { wrapInStyledHtml } from './_htmlwrap';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { rawHtmlGeminiSchema } from '@/lib/geminiSchema';
import OpenAI from 'openai';
import { setTimeout } from 'node:timers/promises';

puppeteer.use(StealthPlugin());

let browser = null;
const browserFetchUrl = process.env.HTMLFETCH_API ? `${process.env.HTMLFETCH_API}/?url=` : undefined;
const browserWSEndpoint = process.env.BROWSERLESS_KEY
  ? `https://chrome.browserless.io?token=${process.env.BROWSERLESS_KEY}`
  : undefined;

// Add a simple logging utility
const log = (msg, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

async function fetchCleanMarkdownFromUrl(
  url,
  filePath,
  fetchImages = false,
  imgDirName = 'images',
  imagesBasePathOverride = undefined,
  removeNonContent = true,
  applyGpt = '',
  bigModel = false,
  rawHtmlMode = false,
  rawHtmlModel = 'gemini'
) {
  try {
    let data;
    log(`Starting conversion for URL: ${url}`, {
      rawHtmlMode,
      rawHtmlModel,
      fetchImages,
      removeNonContent
    });

    // 1) Attempt Cloudflare Worker fetch if `HTMLFETCH_API` is set
    if (browserFetchUrl) {
      log(`Using Cloudflare Worker to fetch HTML`);
      const resp = await fetch(`${browserFetchUrl}${encodeURIComponent(url)}`);
      if (!resp.ok) throw new Error(`Failed to fetch ${url}`);
      data = await resp.text();
      log(`Successfully fetched HTML content (${data.length} bytes)`);
    }
    else {
      // 2) Otherwise use puppeteer locally / browserless
      log(`Using ${browserWSEndpoint ? 'Browserless' : 'Local Puppeteer'} to fetch HTML`);
      if (!browser) {
        if (browserWSEndpoint) {
          browser = await puppeteer.connect({ browserWSEndpoint });
          log(`Connected to Browserless instance`);
        } else {
          browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            headless: 'new',
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--disable-gpu',
              '--window-size=1920x1080',
            ],
          });
          log(`Launched local Puppeteer instance`);
        }
      }

      const page = await browser.newPage();
      log(`Created new page`);
      
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      );
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      });
      
      log(`Navigating to URL`);
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // small delay for stealth
      log(`Waiting for page to stabilize`);
      await setTimeout(5000);

      data = await page.content();
      log(`Retrieved page content (${data.length} bytes)`);
      
      // For simplicity, close the browser after each request
      await browser.close();
      browser = null;
      log(`Closed browser instance`);
    }

    if (rawHtmlMode) {
      if (rawHtmlModel === 'o3-mini') {
        // ----------- OPENAI approach -----------
        log(`Using OpenAI o3-mini model for HTML → MD conversion`);
        if (!process.env.OPENAI_API_KEY) {
          throw new Error("Missing OPENAI_API_KEY environment variable");
        }

        const openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });

        log(`Preparing OpenAI request`);
        const messages = [
          {
            role: "system",
            content:
              "You are a helpful HTML-to-Markdown formatter. The user will provide raw HTML. You return only a JSON with shape { \"page_title\": string, \"markdown_body\": string }."
          },
          { role: "user", content: data },
        ];

        log(`Sending request to OpenAI API`);
        const completion = await openaiClient.chat.completions.create({
          model: "o3-mini",
          reasoning_effort: "low",
          messages,
        });
        log(`Received response from OpenAI`);

        const textOutput = completion.choices[0].message?.content || "";
        let parsed;
        try {
          parsed = JSON.parse(textOutput);
          log(`Successfully parsed OpenAI JSON response`, {
            title_length: parsed.page_title?.length,
            markdown_length: parsed.markdown_body?.length
          });
        } catch (err) {
          log(`Failed to parse OpenAI JSON output`, { textOutput });
          throw err;
        }
        
        const theMarkdown = parsed.markdown_body || "";
        fs.writeFileSync(filePath, theMarkdown, "utf8");
        log(`Wrote markdown to file: ${filePath}`);
        return theMarkdown;

      } else {
        // ----------- GEMINI approach -----------
        log(`Using Gemini 2.0 for HTML → MD conversion`);
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("Missing GEMINI_API_KEY environment variable");
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          systemInstruction:
            "You are an HTML-to-Markdown formatter. Output JSON with shape { page_title, markdown_body } from the user's raw HTML."
        });

        log(`Preparing Gemini request`);
        const generationConfig = {
          responseMimeType: "application/json",
          responseSchema: rawHtmlGeminiSchema,
          temperature: 0.5,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        };
        
        const chat = model.startChat({ generationConfig });
        log(`Sending request to Gemini API`);
        const response = await chat.sendMessage(data);
        log(`Received response from Gemini`);

        const textOutput = response.response.text();
        let parsed;
        try {
          parsed = JSON.parse(textOutput);
          log(`Successfully parsed Gemini JSON response`, {
            title_length: parsed.page_title?.length,
            markdown_length: parsed.markdown_body?.length
          });
        } catch (err) {
          log(`Failed to parse Gemini JSON output`, { textOutput });
          throw err;
        }
        
        const theMarkdown = parsed.markdown_body || "";
        fs.writeFileSync(filePath, theMarkdown, "utf8");
        log(`Wrote markdown to file: ${filePath}`);
        return theMarkdown;
      }
    }

    // If rawHtmlMode is false, fall back to the "Mozilla Readability + Turndown" approach:
    log(`Using Mozilla Readability + Turndown approach`);
    const dom = new JSDOM(data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    log(`Parsed article with Readability`, {
      title: article.title,
      content_length: article.content?.length
    });

    // Convert final HTML -> MD
    const turndown = new TurndownService();
    let markdown = removeNonContent
      ? turndown.turndown(`<h1>${article.title}</h1>${article.content}`)
      : turndown.turndown(data);
    log(`Converted to markdown (${markdown.length} bytes)`);

    fs.writeFileSync(filePath, markdown, "utf8");
    log(`Wrote initial markdown to file: ${filePath}`);

    // If user wants to fetch images, do so
    if (fetchImages) {
      log(`Processing and downloading images`);
      await processMarkdownWithImages(filePath, imgDirName, imagesBasePathOverride);
      log(`Completed image processing`);
    }

    // If user wants GPT-based edits:
    if (applyGpt) {
      log(`Applying GPT transformations`);
      const curMarkdown = fs.readFileSync(filePath, "utf8");
      const gptResponse = await runGPT(null, curMarkdown, applyGpt);
      markdown = gptResponse.content || curMarkdown;
      fs.writeFileSync(filePath, markdown, 'utf8');
      log(`Applied GPT transformations and saved`);
    }

    // Also produce an .html version for convenience
    log(`Generating HTML preview`);
    const converter = new Showdown.Converter();
    const html = converter.makeHtml(markdown);
    fs.writeFileSync(filePath.replace(".md", ".html"), wrapInStyledHtml(html), 'utf8');
    log(`Wrote HTML preview file`);

    return markdown;

  } catch (error) {
    log(`Error during conversion:`, {
      message: error.message,
      stack: error.stack
    });
    if (browser) {
      await browser.close();
      browser = null;
      log(`Closed browser instance after error`);
    }
    throw error;
  }
}

export default fetchCleanMarkdownFromUrl;
