"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ExternalLink, CheckCircle } from "lucide-react"

interface ProcessingModalProps {
  isOpen: boolean
  currentChunk: number
  totalChunks: number
  countdown: number
  isComplete: boolean
  onClose: () => void
  onNavigate: () => void
}

export function ProcessingModal({
  isOpen,
  currentChunk,
  totalChunks,
  countdown,
  isComplete,
  onClose,
  onNavigate,
}: ProcessingModalProps) {
  const progress = ((currentChunk - 1) / totalChunks) * 100

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Translation Complete
              </>
            ) : (
              "Processing Translation"
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isComplete ? (
            <>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  Processing Chunk {currentChunk} of {totalChunks}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Each chunk has been copied to your clipboard</div>
              </div>

              <Progress value={progress} className="w-full" />

              {countdown > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{countdown}</div>
                  <div className="text-sm text-muted-foreground">seconds until next chunk</div>
                </div>
              )}

              <div className="text-xs text-muted-foreground text-center">
                Please manually paste each chunk into the opened tab and submit it. The next chunk will be copied
                automatically after the countdown.
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">All chunks have been processed!</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Click the button below to view your translation results
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={onNavigate} className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Results
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
