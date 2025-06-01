export interface Book {
  id: string
  title: string
  chapters: Chapter[]
  contexts: Record<string, string> // Add book-specific contexts
  createdAt: Date
  updatedAt: Date
}

export interface Chapter {
  id: string
  title: string
  originalText: string
  translatedText: string
  createdAt: Date
  isTranslating?: boolean
}

export interface TranslationChunk {
  id: string
  originalText: string
  translatedText: string
  isTranslating: boolean
}
