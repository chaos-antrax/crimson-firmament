"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { BookManager } from "./components/book-manager"
import { TranslationInterface } from "./components/translation-interface"
import { ContextManager } from "./components/context-manager"
import type { Book, Chapter } from "./types"
import { loadBooks, saveBooks } from "./utils/storage"
import { toast } from "sonner"

export default function TranslatorPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [showContextManager, setShowContextManager] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setBooks(loadBooks())
  }, [])

  const createNewBook = (title: string) => {
    const newBook: Book = {
      id: Date.now().toString(),
      title,
      chapters: [],
      contexts: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const updatedBooks = [...books, newBook]
    setBooks(updatedBooks)
    saveBooks(updatedBooks)
    setSelectedBook(newBook)
  }

  const deleteBook = (bookId: string) => {
    const updatedBooks = books.filter((book) => book.id !== bookId)
    setBooks(updatedBooks)
    saveBooks(updatedBooks)
    if (selectedBook?.id === bookId) {
      setSelectedBook(null)
    }
    toast( "Book deleted",{
      description: "The book and all its chapters have been deleted",
    })
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

  const deleteChapter = (bookId: string, chapterId: string) => {
    const updatedBooks = books.map((book) =>
      book.id === bookId
        ? { ...book, chapters: book.chapters.filter((c) => c.id !== chapterId), updatedAt: new Date() }
        : book,
    )
    setBooks(updatedBooks)
    saveBooks(updatedBooks)

    if (selectedBook?.id === bookId) {
      setSelectedBook(updatedBooks.find((b) => b.id === bookId) || null)
    }
    toast("Chapter deleted",{
      description: "The chapter has been deleted",
    })
  }

  const updateBookContexts = (bookId: string, newContexts: Record<string, string>) => {
    const updatedBooks = books.map((book) =>
      book.id === bookId ? { ...book, contexts: newContexts, updatedAt: new Date() } : book,
    )
    setBooks(updatedBooks)
    saveBooks(updatedBooks)

    if (selectedBook?.id === bookId) {
      setSelectedBook(updatedBooks.find((b) => b.id === bookId) || null)
    }
  }

  const clearAllContexts = (bookId: string) => {
    updateBookContexts(bookId, {})
    toast("All contexts cleared",{
      description: "All translation contexts for this book have been deleted",
    })
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

        <BookManager
          books={books}
          onCreateBook={createNewBook}
          onSelectBook={setSelectedBook}
          onDeleteBook={deleteBook}
        />
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

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowContextManager(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Manage Context ({Object.keys(selectedBook.contexts).length})
          </Button>
          <Button
            variant="outline"
            onClick={() => clearAllContexts(selectedBook.id)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
            disabled={Object.keys(selectedBook.contexts).length === 0}
          >
            <Trash2 className="h-4 w-4" />
            Clear All Context
          </Button>
        </div>
      </div>

      <TranslationInterface
        book={selectedBook}
        onAddChapter={(chapter) => addChapter(selectedBook.id, chapter)}
        onDeleteChapter={(chapterId) => deleteChapter(selectedBook.id, chapterId)}
        onUpdateContexts={(contexts) => updateBookContexts(selectedBook.id, contexts)}
      />

      <ContextManager
        isOpen={showContextManager}
        contexts={selectedBook.contexts}
        onClose={() => setShowContextManager(false)}
        onUpdateContexts={(contexts) => updateBookContexts(selectedBook.id, contexts)}
        onClearAll={() => clearAllContexts(selectedBook.id)}
      />
    </div>
  )
}
