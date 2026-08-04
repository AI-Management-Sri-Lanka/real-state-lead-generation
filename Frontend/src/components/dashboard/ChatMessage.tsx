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

interface Lead {
  id: string
  index: number
  handle: string
  platform: string
  name?: string
  propertyType?: string
  location?: string
  posted?: string
  description?: string
  postLink?: string
}

function parseLeadsFromMarkdown(text: string): { intro: string; leads: Lead[] } | null {
  if (!text) return null

  if (!text.includes('Potential Lead') && !text.includes('### 1. @')) {
    return null
  }

  try {
    const leads: Lead[] = []
    const sections = text.split(/###\s+(?=\d+\.)/)
    if (sections.length <= 1) return null

    const intro = sections[0].trim()

    for (let i = 1; i < sections.length; i++) {
      const section = sections[i].trim()
      const lines = section.split('\n')
      const firstLine = lines[0].trim()

      // Match "1. @username &middot; Facebook" or "1. @username · Facebook" or similar
      const headerMatch = firstLine.match(/^(\d+)\.\s+@([^\s&·]+)(?:\s+(?:&middot;|·|&amp;middot;)\s+(\w+))?/)
      if (!headerMatch) continue

      const index = parseInt(headerMatch[1], 10)
      const handle = headerMatch[2]
      const platform = headerMatch[3] || 'Social Media'

      let name: string | undefined
      let propertyType: string | undefined
      let location: string | undefined
      let posted: string | undefined
      let description: string | undefined
      let postLink: string | undefined

      for (let j = 1; j < lines.length; j++) {
        const line = lines[j].trim()
        if (!line || line === '---') continue

        if (line.startsWith('- **Name:**')) {
          name = line.replace('- **Name:**', '').trim()
        } else if (line.startsWith('- **Property type:**')) {
          propertyType = line.replace('- **Property type:**', '').trim()
        } else if (line.startsWith('- **Location:**')) {
          location = line.replace('- **Location:**', '').trim()
        } else if (line.startsWith('- **Posted:**')) {
          posted = line.replace('- **Posted:**', '').trim()
        } else if (line.startsWith('>')) {
          const descLines = [line.substring(1).trim()]
          while (j + 1 < lines.length && lines[j + 1].trim().startsWith('>')) {
            j++
            descLines.push(lines[j].trim().substring(1).trim())
          }
          description = descLines.join('\n')
        } else {
          const linkMatch = line.match(/\[View post\]\((.+?)\)/)
          if (linkMatch) {
            postLink = linkMatch[1]
          }
        }
      }

      leads.push({
        id: `${index}-${handle}-${platform}-${i}`,
        index,
        handle,
        platform,
        name,
        propertyType,
        location,
        posted,
        description,
        postLink
      })
    }

    return { intro, leads }
  } catch (err) {
    console.error('Error parsing leads:', err)
    return null
  }
}

function LeadCard({ lead }: { lead: Lead }) {
  const getPlatformColors = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return 'bg-blue-600/10 text-blue-400 border-blue-500/20'
      case 'instagram':
        return 'bg-pink-600/10 text-pink-400 border-pink-500/20'
      case 'tiktok':
        return 'bg-cyan-600/10 text-cyan-400 border-cyan-500/20'
      default:
        return 'bg-slate-600/10 text-slate-400 border-slate-500/20'
    }
  }

  const initials = (lead.name || lead.handle || '?')
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-[0_4px_20px_rgba(99,102,241,0.15)] group/card">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300 border border-slate-700/50">
            {initials}
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-white group-hover/card:text-indigo-400 transition-colors">
              {lead.name || lead.handle}
            </h4>
            <p className="truncate text-xs text-slate-400 text-left">@{lead.handle}</p>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getPlatformColors(lead.platform)}`}>
          {lead.platform}
        </span>
      </div>

      <div className="my-3 space-y-2 text-xs text-slate-300 text-left">
        {lead.propertyType && (
          <div>
            <span className="text-slate-500">Property Type:</span> {lead.propertyType}
          </div>
        )}
        {lead.location && (
          <div>
            <span className="text-slate-500">Location:</span> {lead.location}
          </div>
        )}
        {lead.posted && (
          <div>
            <span className="text-slate-500">Posted:</span> {lead.posted}
          </div>
        )}
      </div>

      {lead.description && (
        <div className="mb-4 rounded-xl bg-slate-950/80 p-3 text-xs text-slate-300 leading-relaxed border border-slate-800/80 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/80" />
          <p className="italic pl-1 text-left">"{lead.description}"</p>
        </div>
      )}

      {lead.postLink && (
        <a
          href={lead.postLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center justify-center rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white border border-slate-700/50 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all active:scale-[0.98]"
        >
          View Original Post
        </a>
      )}
    </div>
  )
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

  const parsed = isAssistant ? parseLeadsFromMarkdown(message.content) : null

  return (
    <article
      aria-label={isAssistant ? 'AI response' : 'Your message'}
      className={`group max-w-[85%] ${isAssistant ? 'self-start w-full' : 'self-end'} rounded-[28px] border p-3 transition ${
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
        {message.isTyping ? (
          'AI is thinking...'
        ) : parsed ? (
          <div className="w-full">
            <div className="mb-4 text-slate-100 border-b border-slate-800/80 pb-3 text-left">
              <h3 className="text-base font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                {parsed.intro.replace(/^##\s+/, '')}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {parsed.leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          </div>
        ) : (
          message.content
        )}
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
