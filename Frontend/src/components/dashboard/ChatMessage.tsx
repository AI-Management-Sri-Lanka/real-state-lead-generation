import { useState } from 'react'
import PropTypes from 'prop-types'
import { ClipboardCopy, Check } from 'lucide-react'

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
  const isAssistant = message.role === 'assistant'

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
      className={`group max-w-[85%] ${isAssistant ? 'self-start' : 'self-end'} rounded-[28px] border p-5 shadow-xl transition ${
        isAssistant ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-transparent bg-gradient-to-br from-brand to-violet-500 text-white'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {isAssistant ? 'AI assistant' : 'You'}
        </span>
        {isAssistant && !message.isTyping && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300 transition hover:border-slate-700 hover:text-white"
            aria-label="Copy AI response"
          >
            {copied ? <Check size={12} /> : <ClipboardCopy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      <div className={`whitespace-pre-wrap text-sm leading-7 ${message.isTyping ? 'text-slate-400' : 'text-slate-100'}`}>
        {message.isTyping ? 'AI is thinking...' : message.content}
      </div>

      <p className="mt-4 text-right text-[11px] font-medium text-slate-500">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
