import type { Book } from "../types"

const BOOKS_KEY = "translator_books"
const CONTEXTS_KEY = "translator_contexts"

export const loadBooks = (): Book[] => {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(BOOKS_KEY)
    if (!stored) return []

    const books = JSON.parse(stored)
    return books.map((book: any) => ({
      ...book,
      createdAt: new Date(book.createdAt),
      updatedAt: new Date(book.updatedAt),
      chapters: book.chapters.map((chapter: any) => ({
        ...chapter,
        createdAt: new Date(chapter.createdAt),
      })),
    }))
  } catch (error) {
    console.error("Error loading books:", error)
    return []
  }
}

export const saveBooks = (books: Book[]): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books))
  } catch (error) {
    console.error("Error saving books:", error)
  }
}

export const loadContexts = (): Record<string, string> => {
  if (typeof window === "undefined") return {}

  try {
    const stored = localStorage.getItem(CONTEXTS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error("Error loading contexts:", error)
    return {}
  }
}

export const saveContexts = (contexts: Record<string, string>): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(CONTEXTS_KEY, JSON.stringify(contexts))
  } catch (error) {
    console.error("Error saving contexts:", error)
  }
}
