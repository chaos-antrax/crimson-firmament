"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Copy, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { ProcessingModal } from "./components/processing-modal"
import { useRouter } from "next/navigation"

export default function TextSplitter() {
  const [inputText, setInputText] = useState("")
  const [characterLimit, setCharacterLimit] = useState(5000)
  const [textChunks, setTextChunks] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const router = useRouter()

  const targetUrl = "https://app.readomni.com/thread/01972719-bb15-735d-90e9-efd0773a5f97"

  const splitTextByCharacterCount = (text: string, limit: number): string[] => {
    if (!text) return []

    const chunks: string[] = []
    let currentChunk = ""

    const paragraphs = text.split(/\n\s*\n|\n/)

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i]
      const paragraphWithBreak = currentChunk.length > 0 ? "\n" + paragraph : paragraph

      if (currentChunk.length + paragraphWithBreak.length > limit && currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        currentChunk = paragraph
      } else if (paragraph.length > limit) {
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
    toast("Copied to clipboard",{
      description: "Text has been copied to your clipboard",
      duration: 2000,
    })
  }

  const handleTranslateWithOmni = async () => {
    if (textChunks.length === 0) {
      toast( "No chunks to translate",{
        description: "Please split your text first",
      })
      return
    }

    setIsProcessing(true)
    setCurrentChunkIndex(0)
    setIsComplete(false)

    const newWindow = window.open(targetUrl, "_blank")

    if (!newWindow) {
      toast("Popup blocked",{
        description: "Please allow popups for this site and try again",
      })
      setIsProcessing(false)
      return
    }

    for (let i = 0; i < textChunks.length; i++) {
      setCurrentChunkIndex(i)
      await navigator.clipboard.writeText(textChunks[i])

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6 text-center">Translate with Omni</h1>

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
            <Button onClick={handleTranslateWithOmni} size="lg" variant="secondary">
              Translate with Omni
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
                  <div className="max-h-[200px] overflow-y-auto border p-3 rounded-md whitespace-pre-wrap">{chunk}</div>
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
  )
}
