// src/api/chatApi.ts
// Connects to your FastAPI backend at /api/chat
// The backend proxies to OpenAI with your API key stored server-side.

import { Message } from '@/hooks/useChat'
import { API_ROOT, BASE_URL } from './config'

function buildHistory(messages: Message[]) {
  return messages.map(m => ({
    role: m.role,
    content: m.content,
  }))
}

// ── Fallback demo responses (when backend is not running) ──────────────────
const DEMO_RESPONSES = [
  "I understand you're looking for real estate leads. Let me search Facebook and Instagram for potential buyers matching your criteria...\n\n**Found 8 potential matches:**\n• Kamal Silva — looking for 3-bed in Colombo 7, budget LKR 40–50M (92% match)\n• Nimal Perera — family buyer, Colombo suburbs, budget LKR 25–35M (78% match)\n• Priya Jayawardena — investor, multiple properties, budget LKR 20M+ (65% match)\n\nWould you like me to qualify these leads further?",
  "Based on the buyer requirements you've provided, I've analyzed social media engagement patterns. Properties in Colombo 7 are currently seeing **23% higher buyer interest** compared to last month.\n\nTop buyer profiles found:\n• 12 Facebook group posts matching your property\n• 5 Instagram users with high engagement on similar listings\n\nShall I add these to your lead dashboard?",
  "I can help you refine the buyer search. What is the preferred timeline for the sale? This will help me prioritize leads by urgency and filter out buyers who are just browsing.",
]

let _demoIdx = 0

// ── Main API export ────────────────────────────────────────────────────────
export const chatApi = {
  /**
   * Send a message to the AI assistant.
   * Falls back to demo responses when the API is unreachable.
   */
  async sendMessage(
    content: string,
    history: Message[],
    signal?: AbortSignal
  ): Promise<string> {
    try {
      const res = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history: buildHistory(history) }),
        signal,
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json() as { reply: string }
      return data.reply
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') throw err
      // Demo fallback — remove once backend is ready
      await new Promise(r => setTimeout(r, 1200))
      const reply = DEMO_RESPONSES[_demoIdx % DEMO_RESPONSES.length]
      _demoIdx++
      return reply
    }
  },
}
