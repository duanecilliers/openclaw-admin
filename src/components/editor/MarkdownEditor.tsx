import { useEffect, useRef, useCallback } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  onSave?: () => void
  readOnly?: boolean
}

export default function MarkdownEditor({ value, onChange, onSave, readOnly = false }: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onSaveRef = useRef(onSave)

  // Keep refs current without recreating editor
  onChangeRef.current = onChange
  onSaveRef.current = onSave

  const createExtensions = useCallback(() => {
    const saveKeymap = keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          onSaveRef.current?.()
          return true
        },
      },
    ])

    return [
      lineNumbers(),
      highlightActiveLine(),
      drawSelection(),
      bracketMatching(),
      history(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      markdown({ codeLanguages: languages }),
      oneDark,
      EditorView.lineWrapping,
      EditorState.readOnly.of(readOnly),
      saveKeymap,
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString())
        }
      }),
      EditorView.theme({
        '&': {
          height: '100%',
          minHeight: '300px',
          maxHeight: '600px',
          fontSize: '13px',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        },
        '.cm-content': {
          padding: '12px 0',
        },
        '&.cm-focused': {
          outline: '2px solid rgba(96, 165, 250, 0.5)',
          outlineOffset: '-1px',
          borderRadius: '8px',
        },
      }),
    ]
  }, [readOnly])

  // Create editor once on mount
  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: createExtensions(),
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // Only run on mount — value synced via separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createExtensions])

  // Sync external value changes (e.g., after save or tab switch)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentDoc = view.state.doc.toString()
    if (currentDoc !== value) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      })
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-lg border border-border/50 bg-[#282c34]"
    />
  )
}
