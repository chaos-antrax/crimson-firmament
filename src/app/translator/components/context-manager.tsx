"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Save, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface ContextManagerProps {
  isOpen: boolean
  contexts: Record<string, string>
  onClose: () => void
  onUpdateContexts: (contexts: Record<string, string>) => void
  onClearAll: () => void
}

export function ContextManager({ isOpen, contexts, onClose, onUpdateContexts, onClearAll }: ContextManagerProps) {
  const [editedContexts, setEditedContexts] = useState(contexts)
  const [newChinese, setNewChinese] = useState("")
  const [newEnglish, setNewEnglish] = useState("")

  useEffect(() => {
    setEditedContexts(contexts)
  }, [contexts])

  const handleSave = () => {
    // Remove any empty contexts
    const cleanedContexts = Object.fromEntries(
      Object.entries(editedContexts).filter(([chinese, english]) => chinese.trim() && english.trim()),
    )

    onUpdateContexts(cleanedContexts)
    toast("Contexts saved",{
      description: `${Object.keys(cleanedContexts).length} contexts saved successfully`,
    })
    onClose()
  }

  const addNewContext = () => {
    if (newChinese.trim() && newEnglish.trim()) {
      // Check for duplicates
      if (editedContexts[newChinese.trim()]) {
        toast("Duplicate context",{
          description: "This Chinese term already exists in the context",
        })
        return
      }

      setEditedContexts((prev) => ({
        ...prev,
        [newChinese.trim()]: newEnglish.trim(),
      }))
      setNewChinese("")
      setNewEnglish("")
      toast("Context added",{
        description: "New context term added successfully",
      })
    }
  }

  const removeContext = (chinese: string) => {
    setEditedContexts((prev) => {
      const updated = { ...prev }
      delete updated[chinese]
      return updated
    })
  }

  const updateContext = (oldChinese: string, newChinese: string, english: string) => {
    if (oldChinese !== newChinese && editedContexts[newChinese]) {
      toast("Duplicate context",{
        description: "This Chinese term already exists",
      })
      return
    }

    setEditedContexts((prev) => {
      const updated = { ...prev }
      if (oldChinese !== newChinese) {
        delete updated[oldChinese]
      }
      if (newChinese.trim() && english.trim()) {
        updated[newChinese.trim()] = english.trim()
      }
      return updated
    })
  }

  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete all contexts for this book? This action cannot be undone.")) {
      onClearAll()
      setEditedContexts({})
      onClose()
    }
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
                <Input
                  placeholder="Chinese term (人名/地名/技能/阵法)"
                  value={newChinese}
                  onChange={(e) => setNewChinese(e.target.value)}
                />
                <Input
                  placeholder="English translation"
                  value={newEnglish}
                  onChange={(e) => setNewEnglish(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addNewContext()}
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
              <p className="text-xs text-muted-foreground mt-2">
                Manually add names, locations, skills, and formations for consistent translation
              </p>
            </CardContent>
          </Card>

          {/* Existing Contexts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Existing Contexts ({Object.keys(editedContexts).length})</CardTitle>
                {Object.keys(editedContexts).length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(editedContexts).length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No contexts saved yet. Add terms manually above for consistent translation across chapters.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(editedContexts)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([chinese, english]) => (
                      <div key={chinese} className="flex gap-2 items-center">
                        <Input
                          value={chinese}
                          onChange={(e) => updateContext(chinese, e.target.value, english)}
                          className="flex-1"
                          placeholder="Chinese term"
                        />
                        <span className="text-muted-foreground">→</span>
                        <Input
                          value={english}
                          onChange={(e) => updateContext(chinese, chinese, e.target.value)}
                          className="flex-1"
                          placeholder="English translation"
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
