// src/hooks/useChat.ts
import { useState, useCallback, useRef } from 'react'
import { chatApi } from '@/api/chatApi'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export interface ChatSession {
  id: string
  title: string
  createdAt: Date
  messages: Message[]
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm your AI Real Estate Assistant powered by OpenAI. I can help you find potential buyers from social media, analyze leads, and recommend matching properties.\n\nTo get started, tell me about the property you're listing — location, price range, and target buyer type.",
  timestamp: new Date(),
}

export function useChat() {
  const [messages,    setMessages]    = useState<Message[]>([WELCOME])
  const [isLoading,   setLoading]     = useState(false)
  const [sessions,    setSessions]    = useState<ChatSession[]>([])
  const [sessionId,   setSessionId]   = useState<string>(Date.now().toString())
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setLoading(true)

    abortRef.current = new AbortController()

    try {
      const response = await chatApi.sendMessage(
        content,
        messages.filter(m => m.id !== 'welcome'),
        abortRef.current.signal
      )

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsg.id
            ? { ...m, content: response, isStreaming: false }
            : m
        )
      )
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsg.id
              ? { ...m, content: 'Sorry, something went wrong. Please try again.', isStreaming: false }
              : m
          )
        )
      }
    } finally {
      setLoading(false)
    }
  }, [isLoading, messages])

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
    setLoading(false)
    setMessages(prev =>
      prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m)
    )
  }, [])

  const newChat = useCallback(() => {
    if (messages.length > 1) {
      const session: ChatSession = {
        id: sessionId,
        title: messages.find(m => m.role === 'user')?.content.slice(0, 40) ?? 'Chat session',
        createdAt: new Date(),
        messages,
      }
      setSessions(prev => [session, ...prev.slice(0, 9)])
    }
    setMessages([WELCOME])
    setSessionId(Date.now().toString())
  }, [messages, sessionId])

  const loadSession = useCallback((session: ChatSession) => {
    setMessages(session.messages)
    setSessionId(session.id)
  }, [])

  const clearChat = useCallback(() => {
    setMessages([WELCOME])
  }, [])

  return { messages, isLoading, sessions, sendMessage, stopGeneration, newChat, loadSession, clearChat }
}
