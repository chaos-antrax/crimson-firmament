"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Play, BookOpen } from "lucide-react"
import type { Book, Chapter, TranslationChunk } from "../types"
import { TranslationViewer } from "./translation-viewer"

interface TranslationInterfaceProps {
  book: Book
  contexts: Record<string, string>
  onAddChapter: (chapter: Chapter) => void
  onUpdateContexts: (contexts: Record<string, string>) => void
}

export function TranslationInterface({ book, contexts, onAddChapter, onUpdateContexts }: TranslationInterfaceProps) {
  const [showAddChapter, setShowAddChapter] = useState(false)
  const [chapterTitle, setChapterTitle] = useState("")
  const [chapterText, setChapterText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationChunks, setTranslationChunks] = useState<TranslationChunk[]>([])
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)

  const splitTextIntoChunks = (text: string): string[] => {
    const chunks: string[] = []
    let currentChunk = ""
    const limit = 2500

    const paragraphs = text.split(/\n\s*\n|\n/)

    for (const paragraph of paragraphs) {
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

  const translateChunk = async (text: string, contexts: Record<string, string>): Promise<string> => {
    const contextPrompt =
      Object.keys(contexts).length > 0
        ? `\n\nContext for consistent translation:\n${Object.entries(contexts)
            .map(([chinese, english]) => `${chinese} = ${english}`)
            .join("\n")}\n\nPlease use these translations consistently for the above terms.`
        : ""

    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text + contextPrompt,
        contexts,
      }),
    })

    if (!response.ok) {
      throw new Error("Translation failed")
    }

    const data = await response.json()
    return data.translation
  }

  const extractNewContexts = (originalText: string, translatedText: string): Record<string, string> => {
    // Simple regex to find potential names and locations
    // This is a basic implementation - could be enhanced with better NLP
    const chineseNamePattern = /[一-龯]{2,4}(?=[，。！？\s]|$)/g
    const matches = originalText.match(chineseNamePattern) || []

    const newContexts: Record<string, string> = {}

    // This is a simplified approach - in a real implementation,
    // you'd want more sophisticated name/location detection
    matches.forEach((match) => {
      if (!contexts[match] && match.length >= 2) {
        // For demo purposes, we'll just mark these as needing translation
        // In practice, you'd extract from the translated text
        newContexts[match] = `[${match}]` // Placeholder
      }
    })

    return newContexts
  }

  const handleStartTranslation = async () => {
    if (!chapterTitle.trim() || !chapterText.trim()) return

    setIsTranslating(true)
    const chunks = splitTextIntoChunks(chapterText)

    const initialChunks: TranslationChunk[] = chunks.map((chunk, index) => ({
      id: `chunk-${index}`,
      originalText: chunk,
      translatedText: "",
      isTranslating: false,
    }))

    setTranslationChunks(initialChunks)

    let fullTranslation = ""
    let updatedContexts = { ...contexts }

    for (let i = 0; i < chunks.length; i++) {
      setTranslationChunks((prev) => prev.map((chunk, idx) => (idx === i ? { ...chunk, isTranslating: true } : chunk)))

      try {
        const translation = await translateChunk(chunks[i], updatedContexts)
        fullTranslation += (i > 0 ? "\n\n" : "") + translation

        // Extract new contexts from this chunk
        const newContexts = extractNewContexts(chunks[i], translation)
        updatedContexts = { ...updatedContexts, ...newContexts }

        setTranslationChunks((prev) =>
          prev.map((chunk, idx) =>
            idx === i ? { ...chunk, translatedText: translation, isTranslating: false } : chunk,
          ),
        )
      } catch (error) {
        console.error("Translation error:", error)
        setTranslationChunks((prev) =>
          prev.map((chunk, idx) =>
            idx === i ? { ...chunk, translatedText: "Translation failed", isTranslating: false } : chunk,
          ),
        )
      }
    }

    // Update contexts if new ones were found
    if (Object.keys(updatedContexts).length > Object.keys(contexts).length) {
      onUpdateContexts(updatedContexts)
    }

    // Save the completed chapter
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: chapterTitle,
      originalText: chapterText,
      translatedText: fullTranslation,
      createdAt: new Date(),
    }

    onAddChapter(newChapter)
    setIsTranslating(false)
    setShowAddChapter(false)
    setChapterTitle("")
    setChapterText("")
    setTranslationChunks([])
  }

  if (selectedChapter) {
    return <TranslationViewer chapter={selectedChapter} onBack={() => setSelectedChapter(null)} />
  }

  return (
    <div className="space-y-6">
      {/* Existing Chapters */}
      {book.chapters.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Chapters</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {book.chapters.map((chapter) => (
              <Card
                key={chapter.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedChapter(chapter)}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base">{chapter.title}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">{chapter.createdAt.toLocaleDateString()}</p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Chapter Button */}
      {!showAddChapter && !isTranslating && (
        <Button onClick={() => setShowAddChapter(true)} className="flex items-center gap-2" size="lg">
          <Plus className="h-4 w-4" />
          Add Chapter
        </Button>
      )}

      {/* Add Chapter Form */}
      {showAddChapter && !isTranslating && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Chapter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Chapter title" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} />
            <Textarea
              placeholder="Paste your Chinese text here..."
              className="min-h-[200px]"
              value={chapterText}
              onChange={(e) => setChapterText(e.target.value)}
            />
            <div className="text-sm text-muted-foreground">{chapterText.length} characters</div>
            <div className="flex gap-2">
              <Button
                onClick={handleStartTranslation}
                disabled={!chapterTitle.trim() || !chapterText.trim()}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Translation
              </Button>
              <Button variant="outline" onClick={() => setShowAddChapter(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Translation Progress */}
      {isTranslating && translationChunks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Translating: {chapterTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {translationChunks.map((chunk, index) => (
                <div key={chunk.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Chunk {index + 1}</span>
                    {chunk.isTranslating && <span className="text-sm text-blue-600">Translating...</span>}
                    {chunk.translatedText && !chunk.isTranslating && (
                      <span className="text-sm text-green-600">Complete</span>
                    )}
                  </div>
                  {chunk.translatedText && (
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap">{chunk.translatedText}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
