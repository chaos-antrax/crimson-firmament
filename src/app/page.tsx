"use client"

import { CardFooter } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, FileText, Languages } from "lucide-react"
import { toast } from "sonner"
// import { ProcessingModal } from "./components/processing-modal"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [inputText, setInputText] = useState("")
  const [characterLimit, setCharacterLimit] = useState(5000)
  const [textChunks, setTextChunks] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const targetUrl = "https://app.readomni.com/thread/01972719-bb15-735d-90e9-efd0773a5f97"

  const splitTextByCharacterCount = (text: string, limit: number): string[] => {
    if (!text) return []

    const chunks: string[] = []
    let currentChunk = ""

    // Split text by paragraphs first (double line breaks or single line breaks)
    const paragraphs = text.split(/\n\s*\n|\n/)

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i]

      // If this is not the first paragraph in the chunk, add line break
      const paragraphWithBreak = currentChunk.length > 0 ? "\n" + paragraph : paragraph

      // If adding this paragraph would exceed the limit and we already have content
      if (currentChunk.length + paragraphWithBreak.length > limit && currentChunk.length > 0) {
        // Try to split the current chunk by sentences if it's too long
        chunks.push(currentChunk.trim())
        currentChunk = paragraph
      } else if (paragraph.length > limit) {
        // If a single paragraph is longer than the limit, split it by sentences
        const sentences = paragraph.split(/(?<=[。！？.!?])\s*/)

        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > limit && currentChunk.length > 0) {
            chunks.push(currentChunk.trim())
            currentChunk = sentence
          } else {
            currentChunk += sentence
          }
        }
      } else {
        currentChunk += paragraphWithBreak
      }
    }

    // Add the last chunk if it has content
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }

  const handleSplitText = () => {
    const chunks = splitTextByCharacterCount(inputText, characterLimit)
    setTextChunks(chunks)
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 3000)
    toast("Copied to clipboard", {
      description: "Text has been copied to your clipboard",
      duration: 2000,
    })
  }

  const handleTranslate = async () => {
    if (textChunks.length === 0) {
      toast("No chunks to translate", {
        description: "Please split your text first",
      })
      return
    }

    setIsProcessing(true)
    setCurrentChunkIndex(0)
    setIsComplete(false)

    // Open the target URL in a new tab
    const newWindow = window.open(targetUrl, "_blank")

    if (!newWindow) {
      toast("Popup blocked", {
        description: "Please allow popups for this site and try again",
      })
      setIsProcessing(false)
      return
    }

    // Process each chunk
    for (let i = 0; i < textChunks.length; i++) {
      setCurrentChunkIndex(i)

      // Copy current chunk to clipboard
      await navigator.clipboard.writeText(textChunks[i])

      // Show countdown for 20 seconds (except for the last chunk)
      if (i < textChunks.length - 1) {
        for (let seconds = 20; seconds > 0; seconds--) {
          setCountdown(seconds)
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    }

    setIsComplete(true)
    setCountdown(0)
  }

  const closeProcessingModal = () => {
    setIsProcessing(false)
    setIsComplete(false)
    setCurrentChunkIndex(0)
    setCountdown(0)
  }

  const navigateToResult = () => {
    window.open(targetUrl, "_blank")
    closeProcessingModal()
  }

  useEffect(() => {
    // Redirect to TextSplitter page if there's text to process
    if (inputText && textChunks.length === 0) {
      router.push("/text-splitter")
    }
  }, [inputText, textChunks, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Text Translation Suite</h1>
          <p className="text-xl text-gray-600">Choose your preferred translation method</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/text-splitter")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Translate with Omni</CardTitle>
              <CardDescription className="text-base">
                Split text into chunks and translate using ReadOmni platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>• Split text by character count with smart sentence boundaries</li>
                <li>• Preserve paragraph formatting</li>
                <li>• Automated workflow with ReadOmni integration</li>
                <li>• Copy chunks with one click</li>
              </ul>
              <Button className="w-full" size="lg">
                Get Started
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/translator")}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <Languages className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Local AI Translation</CardTitle>
              <CardDescription className="text-base">
                Translate books chapter by chapter using local Ollama models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>• Real-time translation with local AI models</li>
                <li>• Context preservation for names and locations</li>
                <li>• Book and chapter management system</li>
                <li>• Start reading as translation progresses</li>
              </ul>
              <Button className="w-full" size="lg" variant="secondary">
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* {router.pathname === "/text-splitter" && (
          <div className="container mx-auto py-8 px-4 mt-8">
            <h2 className="text-3xl font-bold mb-6 text-center">Text Splitter</h2>

            <div className="mb-6">
              <Textarea
                placeholder="Paste your text here (支持中文)"
                className="min-h-[200px]"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className="text-sm text-muted-foreground mt-1">{inputText.length} characters</div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <label htmlFor="characterLimit" className="block text-sm font-medium mb-1">
                  Character Limit Per Chunk
                </label>
                <input
                  id="characterLimit"
                  type="number"
                  className="w-full p-2 border rounded"
                  value={characterLimit}
                  onChange={(e) => setCharacterLimit(Number(e.target.value))}
                  min={100}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSplitText} size="lg">
                  Split Text
                </Button>
                {textChunks.length > 0 && (
                  <Button onClick={handleTranslate} size="lg" variant="secondary">
                    Translate
                  </Button>
                )}
              </div>
            </div>

            {textChunks.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Text Chunks ({textChunks.length})</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {textChunks.map((chunk, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="pt-6">
                        <div className="text-sm mb-2 text-muted-foreground">
                          Chunk {index + 1} • {chunk.length} characters
                        </div>
                        <div className="max-h-[200px] overflow-y-auto border p-3 rounded-md whitespace-pre-wrap">
                          {chunk}
                        </div>
                      </CardContent>
                      <CardFooter className="bg-muted/50 flex justify-between">
                        <div className="text-xs text-muted-foreground">
                          {Math.round((chunk.length / characterLimit) * 100)}% of limit
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(chunk, index)}
                          className="flex items-center gap-1"
                        >
                          <Copy className="h-4 w-4" />
                          {copiedIndex === index ? "Copied" : "Copy"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <ProcessingModal
              isOpen={isProcessing}
              currentChunk={currentChunkIndex + 1}
              totalChunks={textChunks.length}
              countdown={countdown}
              isComplete={isComplete}
              onClose={closeProcessingModal}
              onNavigate={navigateToResult}
            />
          </div>
        )} */}
      </div>
    </div>
  )
}
