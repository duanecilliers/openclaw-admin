import { useState, useEffect, useCallback, useRef } from 'react'
import { Save, Loader2, Check, FilePlus } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import MarkdownEditor from '@/components/editor/MarkdownEditor'
import { useWorkspaceFiles, useWorkspaceFile, useWorkspaceFileSave } from '@/hooks/useWorkspaceFile'
import SkillsBrowser from '@/components/skills/SkillsBrowser'

const FILE_TABS = [
  { value: 'soul', label: 'Soul', file: 'SOUL.md' },
  { value: 'user', label: 'User', file: 'USER.md' },
  { value: 'agents', label: 'Agents', file: 'AGENTS.md' },
  { value: 'memory', label: 'Memory', file: 'MEMORY.md' },
  { value: 'tools', label: 'Tools', file: 'TOOLS.md' },
] as const

const SKILLS_TAB = { value: 'skills', label: 'Skills' } as const

function fileForTab(tab: string): string | null {
  const found = FILE_TABS.find((t) => t.value === tab)
  return found?.file ?? null
}

// --- Tab content for a workspace file ---

interface WorkspaceFilePanelProps {
  fileName: string
  agentId: string
}

function WorkspaceFilePanel({ fileName, agentId }: WorkspaceFilePanelProps) {
  const query = useWorkspaceFile(fileName, agentId)
  const saveMutation = useWorkspaceFileSave(agentId)
  const [draft, setDraft] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const prevFileName = useRef(fileName)
  const is404 = query.isError && query.error?.message?.includes('404')

  // Sync draft when data loads
  useEffect(() => {
    if (query.data?.content != null) {
      setDraft(query.data.content)
    }
  }, [query.data?.content])

  // Reset state when file changes
  useEffect(() => {
    if (prevFileName.current !== fileName) {
      prevFileName.current = fileName
      setDraft('')
      setShowSuccess(false)
      saveMutation.reset()
    }
  }, [fileName, saveMutation])

  const isDirty = query.data?.content != null && draft !== query.data.content
  const isSaving = saveMutation.isPending

  const handleSave = useCallback(() => {
    if (isSaving) return
    saveMutation.mutate(
      { name: fileName, content: draft },
      {
        onSuccess: () => {
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 2000)
        },
      }
    )
  }, [fileName, draft, isSaving, saveMutation])

  const handleCreate = useCallback(() => {
    saveMutation.mutate(
      { name: fileName, content: `# ${fileName}\n\n` },
      {
        onSuccess: (_, variables) => {
          setDraft(variables.content)
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 2000)
        },
      }
    )
  }, [fileName, saveMutation])

  // Loading
  if (query.isLoading) {
    return (
      <div className="mt-4 space-y-3">
        <div className="animate-pulse rounded-lg bg-secondary/50 h-[300px]" />
        <div className="animate-pulse rounded bg-secondary/50 h-8 w-24" />
      </div>
    )
  }

  // File not found — offer to create
  if (is404) {
    return (
      <div className="mt-4 rounded-lg border border-border/50 bg-secondary/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-white">{fileName}</span> does not exist yet.
        </p>
        <Button
          size="sm"
          className="mt-4"
          onClick={handleCreate}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Creating…
            </>
          ) : (
            <>
              <FilePlus className="size-3.5" />
              Create {fileName}
            </>
          )}
        </Button>
      </div>
    )
  }

  // Non-404 error
  if (query.isError) {
    return (
      <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">
          Failed to load {fileName}: {query.error?.message ?? 'Unknown error'}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-2">
      {/* Editor */}
      <MarkdownEditor
        value={draft}
        onChange={setDraft}
        onSave={handleSave}
      />

      {/* Action row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {draft.length.toLocaleString()} characters
          {isDirty && (
            <span className="ml-2 text-yellow-400">● Modified</span>
          )}
        </span>

        <div className="flex items-center gap-3">
          {saveMutation.isError && (
            <span className="text-xs text-destructive">
              Save failed: {saveMutation.error?.message ?? 'Unknown error'}
            </span>
          )}

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

// --- Main component ---

interface AgentDetailTabsProps {
  agentId: string
}

export default function AgentDetailTabs({ agentId }: AgentDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<string>('soul')
  const filesQuery = useWorkspaceFiles(agentId)

  const fileExistence = new Map(
    filesQuery.data?.map((f) => [f.name, f.exists]) ?? []
  )

  const activeFile = fileForTab(activeTab)

  return (
    <div className="mt-6">
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="gap-1 bg-secondary/50">
        {FILE_TABS.map(({ value, label, file }) => {
          const exists = fileExistence.get(file)
          return (
            <TabsTrigger
              key={value}
              value={value}
              className="data-[state=active]:bg-secondary data-[state=active]:text-blue-400 data-[state=active]:shadow-none gap-1.5"
            >
              {label}
              {exists != null && (
                <Badge
                  variant={exists ? 'default' : 'destructive'}
                  className="ml-1 px-1.5 py-0 text-[10px] leading-4"
                >
                  {exists ? '✓' : '✗'}
                </Badge>
              )}
            </TabsTrigger>
          )
        })}
        <TabsTrigger
          value={SKILLS_TAB.value}
          className="data-[state=active]:bg-secondary data-[state=active]:text-blue-400 data-[state=active]:shadow-none"
        >
          {SKILLS_TAB.label}
        </TabsTrigger>
      </TabsList>

      {/* File tab contents */}
      {FILE_TABS.map(({ value, file }) => (
        <TabsContent key={value} value={value}>
          {activeFile === file && <WorkspaceFilePanel fileName={file} agentId={agentId} />}
        </TabsContent>
      ))}

      {/* Skills tab */}
      <TabsContent value="skills">
        <div className="mt-4">
          <SkillsBrowser agentId={agentId} />
        </div>
      </TabsContent>
    </Tabs>
    </div>
  )
}
