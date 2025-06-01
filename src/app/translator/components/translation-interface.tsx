"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Play, BookOpen, Trash2 } from "lucide-react"
import type { Book, Chapter, TranslationChunk } from "../types"
import { TranslationViewer } from "./translation-viewer"
import { toast } from "sonner"

interface TranslationInterfaceProps {
  book: Book
  onAddChapter: (chapter: Chapter) => void
  onDeleteChapter: (chapterId: string) => void
  onUpdateContexts: (contexts: Record<string, string>) => void
}

export function TranslationInterface({
  book,
  onAddChapter,
  onDeleteChapter,
  onUpdateContexts,
}: TranslationInterfaceProps) {
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
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text,
        contexts: contexts,
      }),
    })

    if (!response.ok) {
      throw new Error("Translation failed")
    }

    const data = await response.json()
    return data.translation
  }

  const extractTitleFromText = (text: string): string => {
    // Get the first non-empty line
    const lines = text.split("\n").filter((line) => line.trim().length > 0)
    if (lines.length === 0) return ""

    let title = lines[0].trim()

    // If the title is too long, truncate it
    if (title.length > 100) {
      title = title.substring(0, 97) + "..."
    }

    // Remove any common chapter prefixes
    title = title.replace(/^(chapter|section|part)\s+\d+\s*[:.-]?\s*/i, "")

    return title
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
    let finalChunkTranslation = ""

    try {
      for (let i = 0; i < chunks.length; i++) {
        // Update current chunk status to translating
        setTranslationChunks((prev) =>
          prev.map((chunk, idx) => (idx === i ? { ...chunk, isTranslating: true } : chunk)),
        )

        try {
          const translation = await translateChunk(chunks[i], book.contexts)

          // Clean up the translation to remove any conversational responses
          const cleanedTranslation = translation
            .replace(/^.*?(?:I will|I'll).*?(?:context|translation).*?\n*/gi, "")
            .replace(/^.*?(?:Here is|Here's).*?translation.*?\n*/gi, "")
            .replace(/^.*?(?:Using|Based on).*?context.*?\n*/gi, "")
            .trim()

          // Ensure proper paragraph spacing
          const formattedTranslation = cleanedTranslation
            .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double newlines
            .replace(/([.!?])\s*\n\s*([A-Z])/g, "$1\n\n$2") // Add spacing between sentences that start new paragraphs

          fullTranslation += (i > 0 ? "\n\n" : "") + formattedTranslation

          // Store the last chunk's translation for title extraction
          if (i === chunks.length - 1) {
            finalChunkTranslation = formattedTranslation
          }

          // Update chunk with translation
          setTranslationChunks((prev) =>
            prev.map((chunk, idx) =>
              idx === i ? { ...chunk, translatedText: formattedTranslation, isTranslating: false } : chunk,
            ),
          )
        } catch (error) {
          console.error(`Translation error for chunk ${i + 1}:`, error)
          const errorMessage = `Translation failed for chunk ${i + 1}`

          setTranslationChunks((prev) =>
            prev.map((chunk, idx) =>
              idx === i ? { ...chunk, translatedText: errorMessage, isTranslating: false } : chunk,
            ),
          )

          fullTranslation += (i > 0 ? "\n\n" : "") + errorMessage
        }
      }

      // Extract title from the first line of the final chunk
      const extractedTitle = extractTitleFromText(finalChunkTranslation)

      // Use extracted title if available, otherwise use the user-provided title
      const finalTitle = extractedTitle || chapterTitle

      // Save the completed chapter
      const newChapter: Chapter = {
        id: Date.now().toString(),
        title: finalTitle,
        originalText: chapterText,
        translatedText: fullTranslation,
        createdAt: new Date(),
      }

      onAddChapter(newChapter)

      // Reset the form
      setIsTranslating(false)
      setShowAddChapter(false)
      setChapterTitle("")
      setChapterText("")
      setTranslationChunks([])

      toast("Translation completed",{
        description: `Chapter "${finalTitle}" translated successfully in ${chunks.length} chunks`,
      })
    } catch (error) {
      console.error("Translation error:", error)
      toast("Translation failed",{
        description: "There was an error during translation. Please try again.",
      })
      setIsTranslating(false)
    }
  }

  const handleDeleteChapter = (chapterId: string, chapterTitle: string) => {
    if (confirm(`Are you sure you want to delete "${chapterTitle}"?`)) {
      onDeleteChapter(chapterId)
    }
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
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => setSelectedChapter(chapter)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base">{chapter.title}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 p-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteChapter(chapter.id, chapter.title)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            <Input
              placeholder="Chapter title (optional - will be extracted from first line)"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              Title will be extracted from the first line of the translated text. This field is a fallback.
            </div>
            <Textarea
              placeholder="Paste your Chinese text here..."
              className="min-h-[200px]"
              value={chapterText}
              onChange={(e) => setChapterText(e.target.value)}
            />
            <div className="text-sm text-muted-foreground">
              {chapterText.length} characters
              {chapterText.length > 0 && (
                <span className="ml-2">(Will be split into ~{Math.ceil(chapterText.length / 2500)} chunks)</span>
              )}
            </div>
            {Object.keys(book.contexts).length > 0 && (
              <div className="text-sm text-muted-foreground">
                Using {Object.keys(book.contexts).length} context terms for consistent translation
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleStartTranslation}
                disabled={!chapterText.trim()}
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
            <CardTitle>Translating: {chapterTitle || "New Chapter"}</CardTitle>
            <div className="text-sm text-muted-foreground">
              Progress: {translationChunks.filter((chunk) => chunk.translatedText && !chunk.isTranslating).length} /{" "}
              {translationChunks.length} chunks completed
            </div>
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
                    {!chunk.translatedText && !chunk.isTranslating && (
                      <span className="text-sm text-gray-500">Waiting...</span>
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
