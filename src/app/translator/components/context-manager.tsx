"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Save } from "lucide-react"

interface ContextManagerProps {
  isOpen: boolean
  contexts: Record<string, string>
  onClose: () => void
  onUpdateContexts: (contexts: Record<string, string>) => void
}

export function ContextManager({ isOpen, contexts, onClose, onUpdateContexts }: ContextManagerProps) {
  const [editedContexts, setEditedContexts] = useState(contexts)
  const [newChinese, setNewChinese] = useState("")
  const [newEnglish, setNewEnglish] = useState("")

  const handleSave = () => {
    onUpdateContexts(editedContexts)
    onClose()
  }

  const addNewContext = () => {
    if (newChinese.trim() && newEnglish.trim()) {
      setEditedContexts((prev) => ({
        ...prev,
        [newChinese.trim()]: newEnglish.trim(),
      }))
      setNewChinese("")
      setNewEnglish("")
    }
  }

  const removeContext = (chinese: string) => {
    setEditedContexts((prev) => {
      const updated = { ...prev }
      delete updated[chinese]
      return updated
    })
  }

  const updateContext = (chinese: string, english: string) => {
    setEditedContexts((prev) => ({
      ...prev,
      [chinese]: english,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Translation Context</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Context */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Context</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input placeholder="Chinese term" value={newChinese} onChange={(e) => setNewChinese(e.target.value)} />
                <Input
                  placeholder="English translation"
                  value={newEnglish}
                  onChange={(e) => setNewEnglish(e.target.value)}
                />
                <Button
                  onClick={addNewContext}
                  disabled={!newChinese.trim() || !newEnglish.trim()}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Contexts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Existing Contexts ({Object.keys(editedContexts).length})</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(editedContexts).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No contexts saved yet. Add some above to maintain consistency in translations.
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(editedContexts).map(([chinese, english]) => (
                    <div key={chinese} className="flex gap-2 items-center">
                      <Input
                        value={chinese}
                        onChange={(e) => {
                          const newChinese = e.target.value
                          const oldEnglish = editedContexts[chinese]
                          removeContext(chinese)
                          if (newChinese.trim()) {
                            updateContext(newChinese, oldEnglish)
                          }
                        }}
                        className="flex-1"
                      />
                      <span className="text-muted-foreground">=</span>
                      <Input
                        value={english}
                        onChange={(e) => updateContext(chinese, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContext(chinese)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
