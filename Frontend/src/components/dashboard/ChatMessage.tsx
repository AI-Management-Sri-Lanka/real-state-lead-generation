import { useState } from 'react'
import PropTypes from 'prop-types'
import { ClipboardCopy, Check } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

type ChatMessageType = {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
  isTyping?: boolean
}

type ChatMessageProps = {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [theme] = useTheme()
  const isAssistant = message.role === 'assistant'
  const isLightTheme = theme === 'light'

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <article
      aria-label={isAssistant ? 'AI response' : 'Your message'}
      className={`group max-w-[85%] ${isAssistant ? 'self-start' : 'self-end'} rounded-[28px] border p-3 transition ${
        isAssistant
          ? 'border-slate-800 bg-slate-950 text-slate-100 shadow-xl'
          : isLightTheme
          ? 'border-slate-200 bg-white text-slate-950 shadow-sm'
          : 'border-slate-800 bg-blue-950 text-white shadow-xl'
      }`}
    >
      {isAssistant && !message.isTyping && (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300 transition hover:border-slate-700 hover:text-white"
            aria-label="Copy AI response"
          >
            {copied ? <Check size={12} /> : <ClipboardCopy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}

      <div
        className={`whitespace-pre-wrap text-sm leading-7 ${message.isTyping
          ? isLightTheme
            ? 'text-slate-500'
            : 'text-slate-400'
          : isLightTheme
            ? 'text-slate-950'
            : 'text-white'}`}
      >
        {message.isTyping ? 'AI is thinking...' : message.content}
      </div>
    </article>
  )
}

ChatMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['assistant', 'user']).isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.instanceOf(Date).isRequired,
    isTyping: PropTypes.bool,
  }).isRequired,
}

ChatMessage.defaultProps = {
  message: {
    isTyping: false,
  },
}
