import { useState, useEffect, useCallback, useRef } from 'react'
import { FileText, Save, Loader2, Check, RotateCcw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAgentPrompt } from '@/hooks/useAgentPrompt'
import { gatewayApi } from '@/lib/api'

interface SystemPromptEditorProps {
  agentId: string
  agentName: string
}

export default function SystemPromptEditor({ agentId, agentName }: SystemPromptEditorProps) {
  const { query, mutation } = useAgentPrompt(agentId)
  const [draft, setDraft] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [needsRestart, setNeedsRestart] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const prevAgentId = useRef(agentId)

  // Sync draft with fetched prompt
  useEffect(() => {
    if (query.data?.prompt != null) {
      setDraft(query.data.prompt)
    }
  }, [query.data?.prompt])

  // Reset state when agent changes
  useEffect(() => {
    if (prevAgentId.current !== agentId) {
      prevAgentId.current = agentId
      setDraft('')
      setShowSuccess(false)
      setNeedsRestart(false)
      mutation.reset()
    }
  }, [agentId, mutation])

  const isDirty = query.data?.prompt != null && draft !== query.data.prompt
  const isSaving = mutation.isPending

  const handleSave = useCallback(() => {
    if (!isDirty || isSaving) return
    mutation.mutate(
      { id: agentId, prompt: draft },
      {
        onSuccess: () => {
          setShowSuccess(true)
          setNeedsRestart(true)
          setTimeout(() => setShowSuccess(false), 2000)
        },
      }
    )
  }, [agentId, draft, isDirty, isSaving, mutation])

  const handleRestart = useCallback(async () => {
    setIsRestarting(true)
    try {
      await gatewayApi.restart()
      setNeedsRestart(false)
    } catch {
      // Restart may drop the connection — that's expected
      setNeedsRestart(false)
    } finally {
      setIsRestarting(false)
    }
  }, [])

  // Cmd/Ctrl+S keyboard shortcut
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    },
    [handleSave]
  )

  // Loading state
  if (query.isLoading) {
    return (
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">System Prompt</span>
        </div>
        <div className="animate-pulse rounded-lg bg-secondary/50 h-[200px]" />
      </div>
    )
  }

  // No prompt state (404 or empty)
  if (query.isError || !query.data) {
    return (
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">System Prompt</span>
        </div>
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No system prompt configured for <span className="font-medium text-white">{agentName}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This agent uses the default behavior without a persona prompt.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6">
      {/* Restart needed banner */}
      {needsRestart && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Config saved. Restart gateway for changes to take effect.</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRestart}
            disabled={isRestarting}
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1.5"
          >
            {isRestarting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Restarting…
              </>
            ) : (
              <>
                <RotateCcw className="size-3.5" />
                Restart Now
              </>
            )}
          </Button>
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <FileText className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          System Prompt
          {isDirty && (
            <span className="ml-2 text-xs text-yellow-400">● Modified</span>
          )}
        </span>
      </div>

      {/* Textarea */}
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[200px] max-h-[400px] resize-y rounded-lg border border-border/50 bg-secondary/50 p-4 text-sm font-mono text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50"
        placeholder="Enter system prompt…"
        spellCheck={false}
      />

      {/* Action row */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {draft.length.toLocaleString()} characters
        </span>

        <div className="flex items-center gap-3">
          {/* Error message */}
          {mutation.isError && (
            <span className="text-xs text-destructive">
              Save failed: {mutation.error?.message ?? 'Unknown error'}
            </span>
          )}

          {/* Save button */}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="min-w-[90px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving…
              </>
            ) : showSuccess ? (
              <>
                <Check className="size-3.5" />
                Saved ✓
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
