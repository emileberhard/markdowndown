import { useState, useEffect } from "react"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SegmentToggle } from "@/components/ui/segment-toggle"
import { Save } from "lucide-react"

function getLastPartOfUrl(url) {
  url = url.replace(/(\?.*)|(#.*)|\/$/, "")
  const parts = url.split("/")
  const last = parts[parts.length - 1].replace(/[^a-z0-9]/gi, "_").toLowerCase()
  return last
}

function HelpTooltip({ children }) {
  return (
    <TooltipProvider delayDuration={10}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className="ml-2" variant="ghost" size="ghost">
            <Badge variant="outline">?</Badge>
          </Button>
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

  // Main fields
  const [url, setUrl] = useState("")
  const [mode, setMode] = useState("file") // "file" or "clipboard"

  // Options
  const [downloadImages, setDownloadImages] = useState(false)
  const [removeNonContent, setRemoveNonContent] = useState(true)
  const [imagesDir, setImagesDir] = useState("images")
  const [imagesBasePathOverride, setImagesBasePathOverride] = useState("")

  // GPT transformations
  const [gptEnabled, setGptEnabled] = useState(false)
  const [applyGpt, setApplyGpt] = useState("")
  const [bigModel, setBigModel] = useState(false)

  // Raw HTML → MD
  const [rawHtmlMode, setRawHtmlMode] = useState(false)
  const [rawHtmlModel, setRawHtmlModel] = useState("gemini")

  // Loading + success states
  const [isLoading, setIsLoading] = useState(false)
  const [didConvert, setDidConvert] = useState(false)     // NEW: true after successful conversion
  const [convertedMd, setConvertedMd] = useState("")      // NEW: hold final markdown for manual copy

  function saveSettingsToLocalStorage() {
    const settings = {
      url,
      mode,
      downloadImages,
      removeNonContent,
      imagesDir,
      imagesBasePathOverride,
      gptEnabled,
      applyGpt,
      bigModel,
      rawHtmlMode,
      rawHtmlModel,
    }
    localStorage.setItem("settings", JSON.stringify(settings))
  }

  useEffect(() => {
    track("Homepage Loaded")
    const settings = localStorage.getItem("settings")
    if (!settings) return
    try {
      const parsed = JSON.parse(settings)
      if (parsed.url) setUrl(parsed.url)
      if (parsed.mode) setMode(parsed.mode)
      setDownloadImages(!!parsed.downloadImages)
      setRemoveNonContent(!!parsed.removeNonContent)
      if (parsed.imagesDir) setImagesDir(parsed.imagesDir)
      if (typeof parsed.imagesBasePathOverride === "string") {
        setImagesBasePathOverride(parsed.imagesBasePathOverride)
      }
      if (parsed.gptEnabled) setGptEnabled(true)
      if (parsed.applyGpt) setApplyGpt(parsed.applyGpt)
      if (parsed.bigModel) setBigModel(true)
      if (parsed.rawHtmlMode) setRawHtmlMode(true)
      if (parsed.rawHtmlModel) setRawHtmlModel(parsed.rawHtmlModel)
    } catch {}
  }, [])

  // Existing helper for copying text:
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard",
        description: "The markdown has been placed on your clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy to clipboard failed",
        description: "Please try again or use a modern browser.",
      })
    }
  }

  async function submit(e) {
    e?.preventDefault?.()
    if (isLoading) return
    if (!url) {
      return toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
      })
    }
    // If user wants a .zip with images, we can't do that in "clipboard" mode
    if (mode === "clipboard" && downloadImages) {
      return toast({
        title: "Cannot do 'Clipboard' + 'Downloaded Images'",
        description: "Disable 'Download images' or switch output mode to 'File'",
      })
    }

    // Reset states
    setIsLoading(true)
    setDidConvert(false)
    setConvertedMd("") // In case there's leftover from a previous run

    // Build payload
    const payload = {
      url,
      downloadImages,
      imagesDir,
      imagesBasePathOverride,
      removeNonContent,
      applyGpt,
      bigModel,
      rawHtmlMode,
      rawHtmlModel,
    }

    track("Convert Clicked", payload)

    try {
      const resp = await fetch("/api/tomd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!resp.ok) {
        toast({
          title: "Failed to Convert",
          description:
            "Either the URL is invalid or the server is busy. Please try again later.",
        })
        track("Download Failed", payload)
        return
      }

      if (downloadImages) {
        // user gets a zip
        const blob = await resp.blob()
        const tempUrl = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = tempUrl
        a.download = `${getLastPartOfUrl(url)}.zip` || "markdowndown.zip"
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(tempUrl)
        toast({
          title: "Download Started",
          description: "Your markdown + images have started downloading."
        })
        track("Downloaded Markdown", { withImages: true })
      } else {
        // user gets .md text
        const md = await resp.text()

        if (mode === "file") {
          // Download to file
          const a = document.createElement("a")
          a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(md)}`
          a.download = `${getLastPartOfUrl(url)}.md` || "markdowndown.md"
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          toast({
            title: "Converted Successfully",
            description: "Your markdown is being downloaded."
          })
          track("Downloaded Markdown", { withImages: false })
        } else {
          // "clipboard" mode => keep md in state for user to copy manually
          setConvertedMd(md)
          toast({
            title: "Conversion Complete",
            description: "Click 'Copy to Clipboard' to copy your Markdown."
          })
        }
      }
      setDidConvert(true)
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: error?.message || "Unknown error" })
    } finally {
      saveSettingsToLocalStorage()
      setIsLoading(false)
    }
  }

  async function handleSaveAs() {
    // Only works if you have some markdown (e.g. from "clipboard" mode).
    if (!convertedMd) {
      toast({
        title: "Nothing to save",
        description: "Convert in 'Clipboard' mode first, so there's text to save."
      });
      return;
    }

    // Try the File System Access API (Chrome/Edge).
    if ("showSaveFilePicker" in window) {
      try {
        const opts = {
          suggestedName: "my-converted.md",
          types: [
            {
              description: "Markdown file",
              accept: { "text/markdown": [".md"] }
            }
          ]
        }
        const fileHandle = await window.showSaveFilePicker(opts);
        const writable = await fileHandle.createWritable();
        await writable.write(convertedMd);
        await writable.close();
        toast({
          title: "File saved!",
          description: "Your Markdown has been saved to the chosen location."
        });
      } catch (err) {
        console.error("Error saving file:", err);
        // If user cancels, do nothing. Otherwise show error.
        if (err.name !== "AbortError") {
          toast({
            title: "Save error",
            description: err.message || "Failed to save file."
          });
        }
      }
    } else {
      // Fallback for non-supporting browsers
      const blob = new Blob([convertedMd], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-converted.md";
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <main className="w-full min-h-[100vh] py-6 space-y-6 flex justify-center items-center">
      <Toaster />
      <div className="container flex flex-col items-center justify-center">
        <div className="space-y-2 text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            📥
            <br />
            Markdown<b>Down</b>
          </h1>
          <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed dark:text-gray-400">
            Convert any webpage to a clean markdown
            <br />
            w/ images downloaded.
          </p>
        </div>

        <div className="w-full max-w-3xl space-y-4">
          <div className="flex w-full max-w-xl items-center gap-2">
            {/* URL input + Paste */}
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={url}
                type="text"
                placeholder="URL"
                onChange={(val) => setUrl(val.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit()
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
                      description: "URL has been pasted from clipboard",
                    })
                  } catch (err) {
                    toast({
                      title: "Paste Failed",
                      description: "Could not access clipboard",
                    })
                  }
                }}
              >
                Paste
              </Button>
            </div>

            {/* File vs Clipboard */}
            <SegmentToggle
              options={[
                { label: "File", value: "file" },
                { label: "Clipboard", value: "clipboard" },
              ]}
              value={mode}
              onChange={(val) => setMode(val)}
            />

            {/* Convert button — now can show a check if done */}
            <Button
              disabled={isLoading}
              onClick={submit}
              className={[
                "px-5 border-2 border-indigo-300 dark:border-indigo-300 shadow-sm",
                isLoading
                  ? "bg-gray-400"
                  : didConvert
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-400 dark:hover:bg-indigo-500",
              ].join(" ")}
            >
              {isLoading
                ? "Converting..."
                : didConvert
                ? "✔ Done"
                : "Convert"}
            </Button>

            {/* Show this only if user used "clipboard" mode and the final MD is available */}
            {convertedMd && mode === "clipboard" && (
              <Button variant="outline" onClick={() => copyToClipboard(convertedMd)}>
                Copy to Clipboard
              </Button>
            )}
            {/* "Save As..." icon-only button */}
            {convertedMd && mode === "clipboard" && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleSaveAs}
                className="h-10 w-10"
              >
                <Save className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-2 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Options</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Remove non-content */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remove-noncontent"
                    checked={removeNonContent}
                    onClick={() => setRemoveNonContent(!removeNonContent)}
                  />
                  <label
                    className="text-sm leading-none"
                    htmlFor="remove-noncontent"
                  >
                    Remove non-content elements
                    <HelpTooltip>
                      Removes headers/footers/ads from the article. Uses Mozilla
                      Readability if not in raw-HTML mode.
                    </HelpTooltip>
                  </label>
                </div>

                {/* Download images */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="download-images"
                    checked={downloadImages}
                    onClick={() => setDownloadImages(!downloadImages)}
                  />
                  <label
                    className="text-sm leading-none"
                    htmlFor="download-images"
                  >
                    Download images locally
                    <HelpTooltip>
                      Downloads images to a folder, rewriting the MD to point to
                      them. Returns a zip.
                    </HelpTooltip>
                  </label>
                </div>

                {/* GPT? */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="apply-gpt"
                    checked={gptEnabled}
                    onClick={() => {
                      const newVal = !gptEnabled
                      if (!newVal) setApplyGpt("")
                      setGptEnabled(newVal)
                    }}
                  />
                  <Label className="text-sm leading-none" htmlFor="apply-gpt">
                    Apply GPT Filter on Markdown
                    <HelpTooltip>
                      Provide custom instructions to transform or clean up the
                      final Markdown.
                    </HelpTooltip>
                  </Label>
                </div>

                {/* Raw HTML → MD? */}
                <div className="flex items-center space-x-2 mt-3">
                  <Checkbox
                    id="raw-html-mode"
                    checked={rawHtmlMode}
                    onClick={() => setRawHtmlMode(!rawHtmlMode)}
                  />
                  <label
                    className="text-sm leading-none"
                    htmlFor="raw-html-mode"
                  >
                    Use raw HTML → MD
                    <HelpTooltip>
                      Bypass Mozilla Readability; have an LLM parse the raw HTML
                      into MD.
                    </HelpTooltip>
                  </label>
                </div>

                {rawHtmlMode && (
                  <div className="flex mt-2 items-center space-x-2">
                    <Label className="text-sm leading-none">Model:</Label>
                    <SegmentToggle
                      options={[
                        { label: "Gemini 2.0", value: "gemini" },
                        { label: "OpenAI o3-mini", value: "o3-mini" },
                      ]}
                      value={rawHtmlModel}
                      onChange={(val) => setRawHtmlModel(val)}
                    />
                  </div>
                )}
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
                      Images Folder
                    </Label>
                    <Input
                      id="images-folder"
                      placeholder="images"
                      value={imagesDir}
                      onChange={(e) => setImagesDir(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label
                      className="text-sm leading-none"
                      htmlFor="images-basepath"
                    >
                      Base Path Override
                    </Label>
                    <Input
                      id="images-basepath"
                      placeholder={`./${imagesDir}`}
                      value={imagesBasePathOverride}
                      onChange={(e) => setImagesBasePathOverride(e.target.value)}
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
                      Use GPT-4 (longer / costlier)
                    </label>
                  </div>
                  <Textarea
                    id="apply-gpt-txt"
                    className="min-h-[10rem]"
                    placeholder={`Instructions for GPT:\n- Remove all subheadings\n- Add TL;DR at top\n...`}
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
            © {new Date().getFullYear()}{" "}
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
    </main>
  )
}
