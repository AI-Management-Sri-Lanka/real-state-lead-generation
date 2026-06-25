import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  Loader2,
  Plus,
  Search,
  Send,
  MoreVertical,
  Trash2,
  Edit2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatMessage } from "@/components/dashboard/ChatMessage";
import { useAuth } from "@/hooks/useAuth";
import { fetchWithAuth } from "@/api/authApi";

type ChatMessageType = {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
};

type Session = {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessageType[];
};

const BASE_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/api/v1`;

export default function AIChat() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const userIdInt = typeof user?.id === "number" ? user.id : 1;

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? sessions[0],
    [sessions, activeSessionId],
  );

  function sessionTitleFromMessages(session: Session): string {
    if (session.title && session.title !== "New chat") return session.title;
    const firstUserMessage = session.messages.find(
      (m) => m.role === "user" && m.content.trim(),
    );
    if (!firstUserMessage) return session.title || "New chat";
    const snippet = firstUserMessage.content.trim().replace(/\s+/g, " ");
    return snippet.length > 30 ? `${snippet.slice(0, 30)}...` : snippet;
  }

  // ── Load sessions on mount ────────────────────────────────────────────────
  // Sessions are scoped to the current user by the backend via the JWT token.
  // No need to pass user_id as a query param anymore.
  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await fetchWithAuth(`${BASE_URL}/sessions`);
        if (!res.ok) throw new Error("Failed to fetch sessions");
        const data = await res.json();

        const mapped: Session[] = data.map((s: any) => ({
          id: s.session_id,
          title: s.title,
          createdAt: new Date(s.updated_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          messages: [],
        }));

        setSessions(mapped);
        if (mapped.length > 0) setActiveSessionId(mapped[0].id);
      } catch (err) {
        console.error("Error loading sessions:", err);
      }
    }

    if (user) loadSessions();
  }, [user]);

  // ── Load messages for active session ─────────────────────────────────────
  useEffect(() => {
    if (!activeSessionId) return;

    async function loadMessages() {
      try {
        const res = await fetchWithAuth(`${BASE_URL}/sessions/${activeSessionId}`);
        if (!res.ok) throw new Error("Failed to fetch session");
        const data = await res.json();

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== activeSessionId) return s;
            const messages: ChatMessageType[] = (data.messages ?? []).map(
              (m: any) => ({
                id: m.id ?? `${Date.now()}-${Math.random()}`,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.timestamp),
              }),
            );
            return {
              ...s,
              title: sessionTitleFromMessages({
                ...s,
                title: data.title,
                messages,
              }),
              messages,
            };
          }),
        );
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    }

    loadMessages();
  }, [activeSessionId]);

  // ── Create new session ────────────────────────────────────────────────────
  // The backend assigns user_id from the JWT — no need to send it in the body.
  async function handleNewChat(): Promise<string | undefined> {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New chat" }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();

      const newSession: Session = {
        id: data.session_id,
        title: data.title,
        createdAt: "Just now",
        messages: [],
      };

      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessageText("");
      setActiveMenu(null);
      return newSession.id;
    } catch (err) {
      console.error("Error creating session:", err);
      return undefined;
    }
  }

  // ── Persist a message to the backend session ─────────────────────────────
  async function persistMessage(sid: string, role: "user" | "assistant", content: string) {
    try {
      await fetchWithAuth(`${BASE_URL}/sessions/${sid}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, content }),
      });
    } catch (err) {
      console.warn("Failed to persist message:", err);
    }
  }

  // ── Send message & get AI reply ───────────────────────────────────────────
  // POST /chat  body: { query: string }
  // Response: { success, message, data: { route, response, leads, preferences } }
  async function handleSend() {
    const trimmed = messageText.trim();
    if (!trimmed || isTyping) return;

    let sessionId: string | undefined = activeSessionId || undefined;
    if (!sessionId) {
      sessionId = await handleNewChat();
      if (!sessionId) return;
    }

    // Optimistically add user message
    const userMsg: ChatMessageType = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              title: sessionTitleFromMessages({
                ...s,
                messages: [...s.messages, userMsg],
              }),
              messages: [...s.messages, userMsg],
            }
          : s,
      ),
    );
    setMessageText("");
    setIsTyping(true);

    // Persist user message so it survives page navigation
    void persistMessage(sessionId, "user", trimmed);

    try {
      const res = await fetchWithAuth(`${BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ query: trimmed, session_id: sessionId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || "Failed to send message");
      }

      const json = await res.json();
      console.log("Backend response:", json); // Debug log

      // ✅ NEW: Parse the updated backend response structure
      // Response: { success, message, data: { message, leads, route } }
      const responseData = json.data;

      // Start with the AI's message
      let content: string =
        responseData.message || json.message || "Here is what I found.";

      // ✅ NEW: Format leads with the correct field names
      if (responseData.leads && responseData.leads.length > 0) {
        content += `\n\n**Found ${responseData.leads.length} potential leads:**\n\n`;

        const leadLines = responseData.leads.map((lead: any, index: number) => {
          const parts = [];

          // Lead header with username and platform
          parts.push(
            `**${index + 1}. @${lead.userId || lead.username}** (${lead.platform})`,
          );

          // Name if available
          if (lead.name && lead.name !== lead.userId) {
            parts.push(`   Name: ${lead.name}`);
          }

          // Property details
          if (lead.property_type) {
            parts.push(`   Property Type: ${lead.property_type}`);
          }
          if (
            lead.location &&
            lead.location !== "null" &&
            lead.location !== null
          ) {
            parts.push(`   Location: ${lead.location}`);
          }
          if (lead.date) {
            const date = new Date(lead.date);
            parts.push(`   Date: ${date.toLocaleDateString()}`);
          }

          // Post content (truncated if too long)
          if (lead.description) {
            const desc =
              lead.description.length > 200
                ? lead.description.substring(0, 200) + "..."
                : lead.description;
            parts.push(`   Post: "${desc}"`);
          }

          // Link
          if (lead.post_link) {
            parts.push(`   Link: ${lead.post_link}`);
          }

          return parts.join("\n");
        });

        content += leadLines.join("\n\n");
      }

      const aiMsg: ChatMessageType = {
        id: `msg-ai-${Date.now()}`,
        role: "assistant",
        content,
        timestamp: new Date(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, messages: [...s.messages, aiMsg] } : s,
        ),
      );

      // Persist the fully-formatted AI message (including lead details) to the
      // session so it is restored when the user navigates back to this chat.
      void persistMessage(sessionId, "assistant", content);
    } catch (err) {
      console.error("Error sending message:", err);
      const errMsg: ChatMessageType = {
        id: `msg-error-${Date.now()}`,
        role: "assistant",
        content: `Could not connect to the assistant. ${err instanceof Error ? err.message : "Please try again."}`,
        timestamp: new Date(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, messages: [...s.messages, errMsg] } : s,
        ),
      );
    } finally {
      setIsTyping(false);
    }
  }
  // ── Rename session ────────────────────────────────────────────────────────
  async function handleRename(sessionId: string) {
    const session = sessions.find((s) => s.id === sessionId);
    const title = window.prompt("Rename chat session", session?.title ?? "");
    if (!title?.trim()) return;

    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/sessions/${sessionId}?title=${encodeURIComponent(title.trim())}`,
        { method: "PATCH" },
      );
      if (!res.ok) throw new Error("Failed to rename session");

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, title: title.trim() } : s,
        ),
      );
      setActiveMenu(null);
    } catch (err) {
      console.error("Error renaming session:", err);
    }
  }

  // ── Delete session ────────────────────────────────────────────────────────
  async function handleDelete(sessionId: string) {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete session");

      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0]?.id ?? "");
      }
      setActiveMenu(null);
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  }

  function openMenu(e: MouseEvent<HTMLButtonElement>, sessionId: string) {
    e.stopPropagation();
    setActiveMenu(activeMenu === sessionId ? null : sessionId);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout activeNav="AI Chat">
      <div className="flex-1 min-h-0 flex flex-col bg-page text-slate-100 px-4 pt-8 pb-0 sm:px-6 lg:px-10 xl:px-12">
        <div className="mx-auto w-full flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 rounded-[32px] border border-slate-800/80 bg-slate-950/90 shadow-panel overflow-hidden flex flex-col">
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              {/* ── Sidebar ── */}
              <div className="w-full lg:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/80 p-5 overflow-y-auto">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                      AI Assistant
                    </p>
                    <h2 className="mt-3 text-lg font-semibold text-white">
                      Chat history
                    </h2>
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
                    const active = session.id === activeSession?.id;
                    return (
                      <div key={session.id} className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveSessionId(session.id)}
                          className={`flex w-full items-start justify-between gap-3 rounded-3xl border px-4 py-4 text-left transition ${
                            active
                              ? "border-brand bg-slate-900 ring-2 ring-brand/20"
                              : "border-slate-800/80 bg-slate-950/90 hover:border-slate-600 hover:bg-slate-900"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {session.title}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => openMenu(e, session.id)}
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
                    );
                  })}
                </div>
              </div>

              {/* ── Main chat area ── */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex flex-col gap-3 border-b border-slate-800/90 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-500">
                      AI Lead Assistant
                    </p>
                    <h1 className="mt-3 text-2xl font-semibold text-white">
                      Ask, refine and qualify leads in Sri Lanka.
                    </h1>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-6 pt-0 pb-6 sm:px-8">
                    <div className="flex flex-col gap-5">
                      {activeSession?.messages.length ? (
                        activeSession.messages.map((message) => (
                          <ChatMessage key={message.id} message={message} />
                        ))
                      ) : (
                        <div className="grid min-h-[320px] place-items-center rounded-[28px] border border-dashed border-slate-800/90 bg-slate-900/70 p-10 text-center text-slate-400">
                          <div className="mx-auto max-w-xl space-y-4">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-800 text-brand">
                              <Search size={32} />
                            </div>
                            <p className="text-lg font-semibold text-white">
                              No messages yet
                            </p>
                            <p className="text-sm text-slate-500">
                              Start a conversation about property leads, buyer
                              profiles, or neighbourhood search criteria.
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

                  {/* ── Input bar ── */}
                  <div className="border-t border-slate-800/90 bg-slate-950/95 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 rounded-full bg-slate-900/95 p-2 shadow-panel">
                        <div className="flex items-center gap-3 rounded-full border border-slate-800/80 bg-slate-950 px-4 py-3 shadow-inner">
                          <input
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                              }
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.outline = "none";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.outline = "none";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                            placeholder="Type your request for the AI assistant…"
                            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                            style={{
                              outline: "none",
                              boxShadow: "none",
                              WebkitTapHighlightColor: "transparent",
                            }}
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
  );
}
