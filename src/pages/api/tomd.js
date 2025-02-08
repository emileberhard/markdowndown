// /Users/emil/playground/markdowndown/src/pages/api/tomd.js

import fetchCleanMarkdownFromUrl from "./_scrapper";
import path from "path";
import os from "os";
import fs from "fs";
import archiver from "archiver";

export default async function handler(req, res) {
  const {
    url,
    downloadImages,
    imagesDir,
    imagesBasePathOverride,
    removeNonContent,
    applyGpt,
    bigModel,
    rawHtmlMode,      // single checkbox
    rawHtmlModel      // "gemini" or "o3-mini"
  } = req.body || {};

  if (!url) {
    return res.status(400).send("Missing url parameter");
  }

  // Create a temp folder
  const folder = path.join(os.tmpdir(), Math.random().toString(36).substring(7));
  fs.mkdirSync(folder, { recursive: true });

  try {
    const md = await fetchCleanMarkdownFromUrl(
      url,
      path.join(folder, "index.md"),
      !!downloadImages,
      imagesDir || "images",
      imagesBasePathOverride || "",
      !!removeNonContent,
      applyGpt || "",
      !!bigModel,
      !!rawHtmlMode,
      rawHtmlModel || "gemini"
    );

    // If user wants a zip w/ images
    if (downloadImages) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=markdd.zip');
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') console.warn(err);
        else throw err;
      });
      archive.on('error', (err) => { throw err; });
      archive.pipe(res);
      archive.directory(folder, false);
      await archive.finalize();
    } else {
      // Just send the text
      res.setHeader("Content-Type", "text/plain");
      res.send(md);
    }
  } catch (err) {
    console.error("Conversion error:", err?.message);
    res.status(500).send(err?.message || "Unknown conversion error");
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '1mb' },
  },
  maxDuration: 30,
};
