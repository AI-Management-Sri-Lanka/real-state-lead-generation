import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { Loader2, Plus, Search, Send, MoreVertical, Trash2, Edit2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ChatMessage } from '@/components/dashboard/ChatMessage'
import { useAuth } from '@/hooks/useAuth'

type ChatMessageType = {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
  isTyping?: boolean
}

type Session = {
  id: string
  title: string
  createdAt: string
  messages: ChatMessageType[]
}

const initialSessions: Session[] = [
  {
    id: 'session-1',
    title: 'Colombo 3BR search',
    createdAt: 'Today',
    messages: [
      { id: 'm-1', role: 'assistant', content: 'Welcome back! Describe your next buyer profile to start a new search.', timestamp: new Date(), isTyping: false },
    ],
  },
  {
    id: 'session-2',
    title: 'Nugegoda investor list',
    createdAt: 'Yesterday',
    messages: [],
  },
]

export default function AIChat() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [activeSessionId, setActiveSessionId] = useState(initialSessions[0].id)
  const [messageText, setMessageText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? sessions[0],
    [sessions, activeSessionId],
  )

  useEffect(() => {
    if (!activeSessionId && sessions[0]) {
      setActiveSessionId(sessions[0].id)
    }
  }, [activeSessionId, sessions])

  function handleNewChat() {
    const nextId = `session-${Date.now()}`
    const newSession = {
      id: nextId,
      title: 'New chat',
      createdAt: 'Just now',
      messages: [],
    }
    setSessions((current) => [newSession, ...current])
    setActiveSessionId(nextId)
    setMessageText('')
    setActiveMenu(null)
  }

  function handleSend() {
    const trimmed = messageText.trim()
    if (!trimmed) return

    const userMessage: ChatMessageType = { id: `msg-${Date.now()}`, role: 'user', content: trimmed, timestamp: new Date(), isTyping: false }

    setSessions((current) =>
      current.map((session) =>
        session.id === activeSession.id ? { ...session, messages: [...session.messages, userMessage] } : session,
      ),
    )
    setMessageText('')
    setIsTyping(true)

    window.setTimeout(() => {
      const aiMessage: ChatMessageType = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: 'I’m processing the search and matching the best leads for your Sri Lanka property request.',
        timestamp: new Date(),
        isTyping: false,
      }

      setSessions((current) =>
        current.map((session) =>
          session.id === activeSession.id
            ? { ...session, messages: [...session.messages, aiMessage] }
            : session,
        ),
      )
      setIsTyping(false)
    }, 1400)
  }



  function handleRename(sessionId: string) {
    const title = window.prompt('Rename chat session', sessions.find((session) => session.id === sessionId)?.title || '')
    if (!title) return
    setSessions((current) =>
      current.map((session) => (session.id === sessionId ? { ...session, title } : session)),
    )
    setActiveMenu(null)
  }

  function handleDelete(sessionId: string) {
    setSessions((current) => current.filter((session) => session.id !== sessionId))
    if (activeSessionId === sessionId && sessions.length > 1) {
      const next = sessions.find((session) => session.id !== sessionId)
      setActiveSessionId(next?.id || '')
    }
    setActiveMenu(null)
  }

  function openMenu(event: MouseEvent<HTMLButtonElement>, sessionId: string) {
    event.stopPropagation()
    setActiveMenu(activeMenu === sessionId ? null : sessionId)
  }

  return (
    <DashboardLayout activeNav="AI Chat">
      <div className="min-h-screen bg-page text-slate-100 px-4 pt-8 pb-0 sm:px-6 lg:px-10 xl:px-12">
        <div className="mx-auto w-full">
          <div className="rounded-[32px] border border-slate-800/80 bg-slate-950/90 shadow-panel overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800/80 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">AI Assistant</p>
                    <h2 className="mt-3 text-lg font-semibold text-white">Chat history</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="inline-flex items-center gap-2 rounded-3xl bg-brand px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-indigo-500"
                  >
                    <Plus size={16} /> New chat
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  {sessions.map((session) => {
                    const active = session.id === activeSession.id
                    return (
                      <div key={session.id} className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveSessionId(session.id)}
                          onContextMenu={(event) => {
                            event.preventDefault()
                            setActiveMenu(session.id)
                          }}
                          className={`flex w-full items-start justify-between gap-3 rounded-3xl border px-4 py-4 text-left transition ${
                            active
                              ? 'border-brand bg-slate-900 ring-2 ring-brand/20'
                              : 'border-slate-800/80 bg-slate-950/90 hover:border-slate-600 hover:bg-slate-900'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{session.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{session.createdAt}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => openMenu(event, session.id)}
                            aria-label="Open session options"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900 text-slate-400 transition hover:border-slate-600 hover:text-white"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </button>

                        {activeMenu === session.id && (
                          <div className="absolute right-4 top-full z-20 mt-2 w-44 rounded-3xl border border-slate-800/80 bg-slate-950 p-2 shadow-panel">
                            <button
                              type="button"
                              onClick={() => handleRename(session.id)}
                              className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-900"
                            >
                              <Edit2 size={16} /> Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(session.id)}
                              className="mt-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-900"
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex flex-col gap-3 border-b border-slate-800/90 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-500">AI Lead Assistant</p>
                    <h1 className="mt-3 text-2xl font-semibold text-white">Ask, refine and qualify leads in Sri Lanka.</h1>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                    <div className="flex flex-col gap-5">
                      {activeSession?.messages.length ? (
                        activeSession.messages.map((message) => <ChatMessage key={message.id} message={message} />)
                      ) : (
                        <div className="grid min-h-[320px] place-items-center rounded-[28px] border border-dashed border-slate-800/90 bg-slate-900/70 p-10 text-center text-slate-400">
                          <div className="mx-auto max-w-xl space-y-4">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-800 text-brand">
                              <Search size={32} />
                            </div>
                            <p className="text-lg font-semibold text-white">No messages yet</p>
                            <p className="text-sm text-slate-500">
                              Start a conversation about property leads, buyer profiles, or neighbourhood search criteria.
                            </p>
                          </div>
                        </div>
                      )}

                      {isTyping && (
                        <div className="rounded-[28px] border border-slate-800/90 bg-slate-900/90 p-5 text-sm text-slate-400">
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-4 w-4 animate-spin text-brand" />
                            AI is thinking...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-800/90 bg-slate-950/95 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 rounded-full bg-slate-900/95 p-2 shadow-panel">
                        <div className="flex items-center gap-3 rounded-full border border-slate-800/80 bg-slate-950 px-4 py-3 shadow-inner">
                          <input
                            value={messageText}
                            onChange={(event) => setMessageText(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault()
                                handleSend()
                              }
                            }}
                            placeholder="Type your request for the AI assistant…"
                            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
                            aria-label="Type chat message"
                          />
                          <button
                            type="button"
                            onClick={handleSend}
                            className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-brand text-slate-950 transition hover:bg-indigo-500"
                            aria-label="Send message"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

