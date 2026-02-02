import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, lineNumbers, drawSelection } from '@codemirror/view'
import { json } from '@codemirror/lang-json'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'

interface ConfigViewerProps {
  value: string
}

export default function ConfigViewer({ value }: ConfigViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  // Create editor on mount
  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        drawSelection(),
        bracketMatching(),
        foldGutter(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        json(),
        oneDark,
        EditorView.lineWrapping,
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '12px',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          },
          '.cm-content': {
            padding: '12px 0',
          },
          '.cm-gutters': {
            borderRight: '1px solid rgba(255,255,255,0.06)',
          },
        }),
      ],
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync value changes
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
      className="h-[calc(100vh-220px)] min-h-[400px] overflow-hidden rounded-lg border border-border/50 bg-[#282c34]"
    />
  )
}
