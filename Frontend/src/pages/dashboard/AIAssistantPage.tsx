import { useState, useRef, useEffect } from 'react'
import { DashboardLayout }   from '@/components/layout/DashboardLayout'
import { useChat }           from '@/hooks/useChat'
import { useAuth }           from '@/hooks/useAuth'
import { ChatSessionList }   from './components/ChatSessionList'
import { ChatHeader }        from './components/ChatHeader'
import { ChatBubble }        from './components/ChatBubble'
import { ChatInput }         from './components/ChatInput'

export default function AIAssistantPage() {
  const { user }  = useAuth()
  const chat      = useChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [chat.messages])

  function handleSend() {
    if (!input.trim() || chat.isLoading) return
    chat.sendMessage(input.trim())
    setInput('')
  }

  return (
    <DashboardLayout activeNav="AI Chat">
      <div style={{ display:'flex', flex:1, overflow:'hidden', height:'100%' }}>

        {/* Session sidebar */}
        <ChatSessionList
          sessions={chat.sessions}
          onNew={chat.newChat}
          onLoad={chat.loadSession}
        />

        {/* Main chat column */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--color-bg-subtle)' }}>
          <ChatHeader />

          {/* Messages area */}
          <div style={{ flex:1, overflowY:'auto', padding:'28px 32px', display:'flex', flexDirection:'column', gap:24 }}>
            {chat.messages.map(msg => (
              <ChatBubble key={msg.id} msg={msg} userName={user?.name ?? 'You'} />
            ))}
            <div ref={bottomRef} />
          </div>

          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            onStop={chat.stopGeneration}
            isLoading={chat.isLoading}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
