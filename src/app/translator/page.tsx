"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { BookManager } from "./components/book-manager"
import { TranslationInterface } from "./components/translation-interface"
import { ContextManager } from "./components/context-manager"
import type { Book, Chapter } from "./types"
import { loadBooks, saveBooks, loadContexts, saveContexts } from "./utils/storage"

export default function TranslatorPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [contexts, setContexts] = useState<Record<string, string>>({})
  const [showContextManager, setShowContextManager] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setBooks(loadBooks())
    setContexts(loadContexts())
  }, [])

  const createNewBook = (title: string) => {
    const newBook: Book = {
      id: Date.now().toString(),
      title,
      chapters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const updatedBooks = [...books, newBook]
    setBooks(updatedBooks)
    saveBooks(updatedBooks)
    setSelectedBook(newBook)
  }

  const addChapter = (bookId: string, chapter: Chapter) => {
    const updatedBooks = books.map((book) =>
      book.id === bookId ? { ...book, chapters: [...book.chapters, chapter], updatedAt: new Date() } : book,
    )
    setBooks(updatedBooks)
    saveBooks(updatedBooks)

    if (selectedBook?.id === bookId) {
      setSelectedBook(updatedBooks.find((b) => b.id === bookId) || null)
    }
  }

  const updateContexts = (newContexts: Record<string, string>) => {
    setContexts(newContexts)
    saveContexts(newContexts)
  }

  if (!selectedBook) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-6 text-center">Local AI Translation</h1>

        <BookManager books={books} onCreateBook={createNewBook} onSelectBook={setSelectedBook} />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedBook(null)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Books
          </Button>
          <h1 className="text-2xl font-bold">{selectedBook.title}</h1>
        </div>

        <Button variant="outline" onClick={() => setShowContextManager(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Manage Context
        </Button>
      </div>

      <TranslationInterface
        book={selectedBook}
        contexts={contexts}
        onAddChapter={(chapter) => addChapter(selectedBook.id, chapter)}
        onUpdateContexts={updateContexts}
      />

      <ContextManager
        isOpen={showContextManager}
        contexts={contexts}
        onClose={() => setShowContextManager(false)}
        onUpdateContexts={updateContexts}
      />
    </div>
  )
}
