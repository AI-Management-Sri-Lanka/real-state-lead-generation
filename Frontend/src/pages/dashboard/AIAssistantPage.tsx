// src/pages/dashboard/AIAssistantPage.tsx
import { useState, useRef, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useChat }         from '@/hooks/useChat'
import { useAuth }         from '@/hooks/useAuth'
import { ChatSessionList } from './components/ChatSessionList'
import { ChatHeader }      from './components/ChatHeader'
import { ChatBubble }      from './components/ChatBubble'
import { ChatInput }       from './components/ChatInput'

export default function AIAssistantPage() {
  const { user }  = useAuth()
  const chat      = useChat()
  const [input, setInput]           = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages])

  function handleSend() {
    if (!input.trim() || chat.isLoading) return
    chat.sendMessage(input.trim())
    setInput('')
  }

  return (
    <DashboardLayout activeNav="AI Chat">
      {/*
       * RESPONSIVE CHAT LAYOUT
       *
       * Mobile  (<md): sidebar hidden behind a slide-over drawer.
       *                A hamburger icon in ChatHeader toggles it.
       * Tablet+ (≥md): sidebar pinned left, chat fills remainder.
       *
       * The outer div must fill the DashboardLayout <main> exactly
       * (flex-1 + h-full + overflow-hidden) so the message area
       * scrolls independently rather than the whole page.
       */}
      <div className="flex h-full w-full overflow-hidden">

        {/* ── Mobile sidebar backdrop ───────────────────────────── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Session sidebar ───────────────────────────────────── */}
        {/*
         * FIX: was inline `width:240` with no responsive breakpoints.
         * Mobile: fixed overlay (z-40, slide in/out via translate).
         * md+: static sidebar, no overlay, no z-index needed.
         */}
        <aside
          className={[
            // shared
            'flex h-full flex-shrink-0 flex-col overflow-hidden',
            // mobile: fixed overlay
            'fixed left-0 top-0 z-40 w-72 transition-transform duration-300 ease-out md:static md:z-auto md:w-60 md:translate-x-0 md:transition-none lg:w-64',
            // slide in/out on mobile
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <ChatSessionList
            sessions={chat.sessions}
            onNew={() => { chat.newChat(); setSidebarOpen(false) }}
            onLoad={s  => { chat.loadSession(s); setSidebarOpen(false) }}
          />
        </aside>

        {/* ── Main chat column ──────────────────────────────────── */}
        {/*
         * FIX: was `flex:1` with no explicit height, causing the message
         * area not to scroll properly. Now uses `min-h-0` so flexbox
         * allows the inner scroll container to shrink correctly.
         */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

          {/* Header — passes toggle fn so mobile hamburger can open sidebar */}
          <ChatHeader onMenuToggle={() => setSidebarOpen(v => !v)} />

          {/* ── Messages scroll area ─────────────────────────────── */}
          <div
            className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8"
            style={{ background: 'var(--color-bg-subtle)' }}
          >
            <div className="mx-auto flex max-w-3xl flex-col gap-5">
              {chat.messages.map(msg => (
                <ChatBubble key={msg.id} msg={msg} userName={user?.name ?? 'You'} />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* ── Input bar ────────────────────────────────────────── */}
          {/*
           * Wraps ChatInput in a centred max-width container so on
           * wide screens it doesn't stretch wall-to-wall.
           */}
          <div
            className="flex-shrink-0"
            style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}
          >
            <div className="mx-auto max-w-3xl">
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                onStop={chat.stopGeneration}
                isLoading={chat.isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
