// src/pages/dashboard/components/ChatInput.tsx
import { KeyboardEvent, useRef, useEffect } from 'react'
import { Send, Square } from 'lucide-react'

interface Props {
  value:     string
  onChange:  (v: string) => void
  onSend:    () => void
  onStop:    () => void
  isLoading: boolean
}

export function ChatInput({ value, onChange, onSend, onStop, isLoading }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea up to ~5 lines
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }, [value])

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter adds newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const canSend = isLoading || value.trim().length > 0

  return (
    /*
     * RESPONSIVE FIX:
     * - Switched from <input> to auto-growing <textarea> so longer
     *   property descriptions don't force horizontal scroll.
     * - Removed fixed `height:52` from input; textarea grows naturally.
     * - Padding scales with sm: breakpoint.
     * - Mic button hidden on very small screens (xs) to save space;
     *   the label "Record" from the original screenshot is replaced by
     *   an icon-only button with aria-label.
     */
    <div
      style={{
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        boxSizing: 'border-box',
      }}
      className="sm:px-5 sm:py-3"
    >
      {/* (voice recording removed) */}

      {/* Textarea wrapper */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          background: 'var(--color-bg-muted)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 20,
          padding: '8px 12px',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          gap: 6,
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKey}
          onFocus={e => {
            e.currentTarget.style.outline = 'none'
            e.currentTarget.style.boxShadow = 'none'
          }}
          onBlur={e => {
            e.currentTarget.style.outline = 'none'
            e.currentTarget.style.boxShadow = 'none'
          }}
          placeholder="Describe your property and ideal buyer…"
          rows={1}
          style={{
            flex: 1,
            minHeight: 24,
            maxHeight: 140,
            background: 'none',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            resize: 'none',
            fontSize: 14,
            lineHeight: '1.6',
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-text-heading)',
            overflowY: 'auto',
            WebkitTapHighlightColor: 'transparent',
          }}
        />
      </div>

      {/* Send / Stop */}
      <button
        onClick={isLoading ? onStop : onSend}
        disabled={!canSend}
        aria-label={isLoading ? 'Stop generation' : 'Send message'}
        style={{
          width: 42, height: 42,
          borderRadius: 12,
          border: 'none',
          cursor: canSend ? 'pointer' : 'default',
          background: isLoading
            ? '#EF4444'
            : 'linear-gradient(135deg,#3D3BF3,#5B5BFF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white',
          flexShrink: 0,
          opacity: canSend ? 1 : 0.45,
          boxShadow: '0 2px 10px rgba(61,59,243,0.30)',
          transition: 'opacity 0.15s, background 0.15s',
          marginBottom: 1,
        }}
      >
        {isLoading ? <Square size={16} /> : <Send size={16} />}
      </button>
    </div>
  )
}
