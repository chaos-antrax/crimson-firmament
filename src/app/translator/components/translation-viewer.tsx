"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import type { Chapter } from "../types"
import { useState } from "react"

interface TranslationViewerProps {
  chapter: Chapter
  onBack: () => void
}

export function TranslationViewer({ chapter, onBack }: TranslationViewerProps) {
  const [showOriginal, setShowOriginal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Chapters
          </Button>
          <h2 className="text-2xl font-bold">{chapter.title}</h2>
        </div>

        <Button variant="outline" onClick={() => setShowOriginal(!showOriginal)} className="flex items-center gap-2">
          {showOriginal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showOriginal ? "Hide Original" : "Show Original"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {showOriginal && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Original Text</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm">{chapter.originalText}</div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={showOriginal ? "" : "lg:col-span-2"}>
          <CardHeader>
            <CardTitle className="text-lg">Translation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap">{chapter.translatedText}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
