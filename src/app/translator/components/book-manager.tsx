"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Book, FileText, Plus, Trash2 } from "lucide-react"
import type { Book as BookType } from "../types"
import { toast } from "sonner"

interface BookManagerProps {
  books: BookType[]
  onCreateBook: (title: string) => void
  onSelectBook: (book: BookType) => void
  onDeleteBook: (bookId: string) => void
}

export function BookManager({ books, onCreateBook, onSelectBook, onDeleteBook }: BookManagerProps) {
  const [newBookTitle, setNewBookTitle] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCreateBook = () => {
    if (newBookTitle.trim()) {
      onCreateBook(newBookTitle.trim())
      setNewBookTitle("")
      setIsDialogOpen(false)
    }
  }

  const handleDeleteBook = (e: React.MouseEvent, bookId: string, bookTitle: string) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete "${bookTitle}" and all its chapters?`)) {
      onDeleteBook(bookId)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold">Your Books</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Book
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Book</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Enter book title"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreateBook()}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBook} disabled={!newBookTitle.trim()}>
                  Create Book
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {books.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Book className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle className="mb-2">No books yet</CardTitle>
            <CardDescription>Create your first book to start translating</CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <Card
              key={book.id}
              className="cursor-pointer hover:shadow-lg transition-shadow relative group"
              onClick={() => onSelectBook(book)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{book.chapters.length} chapters</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 p-1"
                      onClick={(e) => handleDeleteBook(e, book.id, book.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                <CardDescription>
                  <div>Last updated: {book.updatedAt.toLocaleDateString()}</div>
                  <div className="text-xs mt-1">{Object.keys(book.contexts).length} saved contexts</div>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
