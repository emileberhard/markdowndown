/**
* This code was generated by v0 by Vercel.
* @see https://v0.dev/t/UzrxpgVEsxU
* Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
*/

/** Add fonts into your Next.js project:

import { Inter } from 'next/font/google'
import { Inter } from 'next/font/google'

inter({
  subsets: ['latin'],
  display: 'swap',
})

inter({
  subsets: ['latin'],
  display: 'swap',
})

To read more about using these font, please visit the Next.js documentation:
- App Directory: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- Pages Directory: https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
**/
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
 import { track } from "./analytics"
import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SegmentToggle } from "@/components/ui/segment-toggle"

function getLastPartOfUrl(url){
  // remove params and hash and trailing slash
  url = url.replace(/(\?.*)|(#.*)|\/$/, "")
  const parts = url.split("/")
  // convert to filename safe string
  const last = parts[parts.length - 1].replace(/[^a-z0-9]/gi, '_').toLowerCase()
  return last
}


function HelpTooltip({children}){
  return (
    <TooltipProvider delayDuration={10}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className="ml-2" variant="ghost" size="ghost" ><Badge variant="outline">?</Badge></Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
export function Homepage() {
  const { toast } = useToast()
  const [url, setUrl] = useState("");
  const [geminiRawHtmlMode, setGeminiRawHtmlMode] = useState(false);
  const [imagesDir, setImagesDir] = useState("images");
  const [downloadImages, setDownloadImages] = useState(false);
  const [removeNonContent, setRemoveNonContent] = useState(true);
  const [imagesBasePathOverride, SetImagesBasePathOverride] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [gptEnabled, setGptEnabled] = useState(false);
  const [applyGpt, setApplyGpt] = useState("");
  const [bigModel, setBigModel] = useState(false);
  const [mode, setMode] = useState("file");
  const [downloadFilePath, setDownloadFilePath] = useState("downloads");

  const [md, setMd] = useState("");

  function saveSettingsToLocalStorage(){
    const settings = {
      url,
      imagesDir,
      downloadImages,
      imagesBasePathOverride,
      removeNonContent,
      applyGpt,
      bigModel,
      geminiRawHtmlMode,
      mode,
      downloadFilePath
    }
    localStorage.setItem("settings", JSON.stringify(settings))
  }

  useEffect(()=>{
    track("Homepage Loaded")
    const settings = localStorage.getItem("settings");
    if (settings){
      const parsed = JSON.parse(settings);
      setUrl(parsed.url || "")
      setApplyGpt(parsed.applyGpt || "")
      if (parsed.applyGpt) setGptEnabled(true)
      setRemoveNonContent(!!parsed.removeNonContent)
      setBigModel(!!parsed.bigModel)
      setImagesDir(parsed.imagesDir)
      setDownloadImages(!!parsed.downloadImages)
      SetImagesBasePathOverride(parsed.imagesBasePathOverride)
      setGeminiRawHtmlMode(!!parsed.geminiRawHtmlMode)
      setMode(parsed.mode || "file")
      setDownloadFilePath(parsed.downloadFilePath || "downloads")
    }
  }, [])

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "The markdown has been placed on your clipboard."
      })
    } catch (error) {
      toast({
        title: "Copy to clipboard failed",
        description: "Please try again or use a modern browser."
      })
    }
  }

  async function submit(e){
    e?.preventDefault?.()
    if (isLoading){
      return;
    }
    if (!url){
      return toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
      })
    }

    if (mode === "clipboard" && downloadImages) {
      return toast({
        title: "Clipboard mode not possible with downloaded images",
        description: "Disable 'Download images locally' or switch to 'File' mode."
      })
    }

    const payload = {
      url,
      downloadImages,
      imagesDir,
      imagesBasePathOverride,
      removeNonContent,
      applyGpt,
      bigModel,
      geminiRawHtmlMode
    }

    track("Convert Clicked", payload)

    setIsLoading(true)
    try {
      const resp = await fetch("/api/tomd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok){
        toast({
          title: "Failed to Convert",
          description: "Either the URL is invalid or the server is too busy. Please try again later.",
        })
        track("Download Failed", payload)
      } else {
        if (downloadImages) {
          const blob = await resp.blob();
          const tempUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = tempUrl;
          a.download = `${getLastPartOfUrl(url)}.zip` || "markdowndown.zip";
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(tempUrl);
          toast({
            title: "Download Started",
            description: `Your markdown + images have started downloading.\n${downloadFilePath}`
          })
          track("Downloaded Markdown", {withImages: true})
        }
        else {
          const md = await resp.text();
          if (mode === "file") {
            toast({
              title: "Converted Successfully",
              description: `Your markdown is being downloaded.\n${downloadFilePath}`
            })
            const a = document.createElement('a');
            a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(md)}`;
            a.download = `${getLastPartOfUrl(url)}.md` || "markdowndown.md";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            track("Downloaded Markdown", {withImages: false})
          } else {
            await copyToClipboard(md);
            track("Copied to Clipboard", payload)
          }
        }
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: error?.message || "Unknown error" })
    } finally {
      saveSettingsToLocalStorage()
      setIsLoading(false)
    }
  }
  return (
    <main className="w-full min-h-[100vh] py-6 space-y-6 flex justify-center items-center">
      <Toaster />
      <div className="container flex flex-col items-center justify-center">
        <div className="space-y-2 text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            📥<br/>Markdown<b>Down</b>
          </h1>
          <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed dark:text-gray-400">
            Convert any webpage to a clean markdown<br/> w/ images downloaded.
          </p>
        </div>

        <div className="w-full max-w-xl space-y-4">
          <div className="flex w-full max-w-xl items-center gap-2">
            {/* Left side: Input + Paste */}
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={url}
                type="text"
                placeholder="URL"
                onChange={(val)=>setUrl(val.target.value)}
                onKeyDown={(e)=>{
                  if (e.key === "Enter"){
                    submit()
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText()
                    setUrl(text)
                    toast({
                      title: "URL Pasted",
                      description: "URL has been pasted from clipboard"
                    })
                  } catch (err) {
                    toast({
                      title: "Paste Failed",
                      description: "Could not access clipboard"
                    })
                  }
                }}
              >
                Paste
              </Button>
            </div>

            {/* Middle: Segment Toggle */}
            <SegmentToggle
              options={[
                { label: "File", value: "file" },
                { label: "Clipboard", value: "clipboard" },
              ]}
              value={mode}
              onChange={(val)=>setMode(val)}
            />

            {/* Right: Convert button (primary style) */}
            <Button
              disabled={isLoading}
              className="px-5 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-400 dark:hover:bg-indigo-500 border-2 border-indigo-300 dark:border-indigo-300 shadow-sm"
              onClick={submit}
            >
              {isLoading ? "Converting..." : "Convert"}
            </Button>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Label htmlFor="download-path">Download Path</Label>
            <Input
              id="download-path"
              placeholder="downloads"
              value={downloadFilePath}
              onChange={(e) => setDownloadFilePath(e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Folder/path where the downloaded file (or zip) will be placed.<br/>
              (Currently this is just stored for reference in localStorage.)
            </p>
          </div>
          
          <div className="space-y-2 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remove-noncontent"
                    checked={removeNonContent}
                    onClick={() => setRemoveNonContent(!removeNonContent)}
                  />
                  <label className="text-sm leading-none" htmlFor="remove-noncontent">
                    Remove non-content elements 
                    <HelpTooltip>
                      Removes non-content elements like headers, footers, ads etc.
                    </HelpTooltip>
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remove-images"
                    checked={downloadImages}
                    onClick={() => setDownloadImages(!downloadImages)}
                  />
                  <label className="text-sm leading-none" htmlFor="remove-images">
                    Download images locally and link them
                    <HelpTooltip>
                      Instead of linking to remote images, download them locally and link them in the markdown.<br/>
                      Gives you a zip file with markdown and images folder.
                    </HelpTooltip>
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="apply-gpt"
                    checked={gptEnabled}
                    onClick={() => {
                      const newValue = !gptEnabled;
                      if (!newValue){
                        setApplyGpt("")
                      }
                      setGptEnabled(newValue);
                    }}
                  />
                  <Label className="text-sm leading-none" htmlFor="apply-gpt">
                    Apply GPT Filter on Markdown
                    <HelpTooltip>
                      Apply custom instructions to further clean up or transform the markdown content using Gemini Flash 2.0
                    </HelpTooltip>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gemini-raw-html-mode"
                    checked={geminiRawHtmlMode}
                    onClick={() => setGeminiRawHtmlMode(!geminiRawHtmlMode)}
                  />
                  <label className="text-sm leading-none" htmlFor="gemini-raw-html-mode">
                    Use Gemini 2.0 to parse raw HTML into Markdown
                  </label>
                </div>
              </CardContent>
            </Card>

            {downloadImages && (
              <Card>
                <CardHeader>
                  <CardTitle>Image Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-sm leading-none" htmlFor="images-folder">
                      Override Images Folder Name
                      <HelpTooltip>
                        Override the default folder name for images (Only used when downloading images)
                      </HelpTooltip>
                    </Label>
                    <Input
                      id="images-folder"
                      placeholder="Enter folder name"
                      type="text"
                      value={imagesDir}
                      onChange={(val) => setImagesDir(val.target.value)}
                    />
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label className="text-sm leading-none" htmlFor="images-basepath">
                      Override base path for images in markdown
                      <HelpTooltip>
                        Override the base path for linked images in markdown (Only used when downloading images)
                      </HelpTooltip>
                    </Label>
                    <Input
                      id="images-basepath"
                      placeholder={`./${imagesDir}`}
                      type="text"
                      value={imagesBasePathOverride}
                      onChange={(val) => SetImagesBasePathOverride(val.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {gptEnabled && (
              <Card>
                <CardHeader>
                  <CardTitle>GPT Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="big-model"
                      checked={bigModel}
                      onClick={() => setBigModel(!bigModel)}
                    />
                    <label className="text-sm leading-none" htmlFor="big-model">
                      Use GPT4 (takes longer)
                    </label>
                  </div>
                  <Textarea
                    id="apply-gpt-txt"
                    className="min-h-[10rem]"
                    placeholder={`Instructions for GPT like:\n\n'Add a tldr section at the top'\n'Remove all links'\n'Change all subheadings to h3'`}
                    value={applyGpt}
                    onChange={(val) => setApplyGpt(val.target.value)}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <footer className="mt-10 text-xs text-gray-500 dark:text-gray-400">
          <p>
            © {new Date().getFullYear()}&nbsp;
            <a
              className="underline"
              href="https://twitter.com/_asadmemon"
              target="_blank"
              rel="noopener noreferrer"
            >
              Asad Memon
            </a>
          </p>
        </footer>
      </div>
    </main>);
}
