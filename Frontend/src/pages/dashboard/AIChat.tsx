import { useEffect, useRef, useMemo, useState, useCallback, type MouseEvent } from "react";
import { Loader2, Plus, Search, Send, MoreVertical, Trash2, Edit2 } from "lucide-react";
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

// Helper outside component — no stale closure risk
function deriveTitleFromMessages(messages: ChatMessageType[], fallback: string): string {
  const isFallbackDefault = !fallback || fallback.toLowerCase() === "new chat";
  if (!isFallbackDefault) return fallback;
  const first = messages.find((m) => m.role === "user" && m.content.trim());
  if (!first) return fallback || "New chat";
  const snippet = first.content.trim().replace(/\s+/g, " ");
  return snippet.length > 30 ? `${snippet.slice(0, 30)}...` : snippet;
}

export default function AIChat() {
  const { user } = useAuth();
  const userName = (user as any)?.name || (user as any)?.email || "You";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; value: string } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages or typing state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, isTyping, activeSessionId]);

  // Derive active session — always prefer explicit activeSessionId
  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? sessions[0] ?? null,
    [sessions, activeSessionId],
  );

  // ── Load sessions on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    async function loadSessions() {
      try {
        const res = await fetchWithAuth(`${BASE_URL}/sessions`);
        if (!res.ok) return;
        const data = await res.json();
        const mapped: Session[] = data.map((s: any) => ({
          id: s.session_id,
          title: s.title || "New chat",
          createdAt: new Date(s.updated_at).toLocaleDateString(undefined, {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          }),
          messages: [],
        }));
        setSessions(mapped);
        if (mapped.length > 0) setActiveSessionId(mapped[0].id);
      } catch (err) {
        console.error("Error loading sessions:", err);
      }
    }
    loadSessions();
  }, [user]);

  // ── Load messages when active session changes ───────────────────────────
  useEffect(() => {
    if (!activeSessionId) return;
    // Skip if messages already loaded
    const existing = sessions.find((s) => s.id === activeSessionId);
    if (existing && existing.messages.length > 0) return;

    async function loadMessages() {
      try {
        const res = await fetchWithAuth(`${BASE_URL}/sessions/${activeSessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        const messages: ChatMessageType[] = (data.messages ?? []).map((m: any) => ({
          id: m.id ?? `${Date.now()}-${Math.random()}`,
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.timestamp),
        }));
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages, title: deriveTitleFromMessages(messages, data.title || s.title) }
              : s,
          ),
        );
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    }
    loadMessages();
  }, [activeSessionId]);

  // ── Create new session ──────────────────────────────────────────────────
  const handleNewChat = useCallback(async (): Promise<string | undefined> => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New chat" }),
      });
      if (!res.ok) return undefined;
      const data = await res.json();
      const newSession: Session = {
        id: data.session_id,
        title: data.title || "New chat",
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
  }, []);

  const generateSessionTitle = useCallback(async (sessionId: string, userQuery: string) => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/sessions/${sessionId}/generate-title`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_query: userQuery }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, title: data.title } : s))
          );
        }
      }
    } catch (err) {
      console.error("Error generating session title:", err);
    }
  }, []);

  // ── Send message ────────────────────────────────────────────────────────
  async function handleSend() {
    const trimmed = messageText.trim();
    if (!trimmed || isTyping) return;

    // Resolve session id first — await new chat creation if needed
    let resolvedId = activeSessionId;
    if (!resolvedId) {
      const newId = await handleNewChat();
      if (!newId) return;
      resolvedId = newId;
    }

    const targetSession = sessions.find((s) => s.id === resolvedId);
    const isFirstMessage = !targetSession || targetSession.messages.length === 0;

    const userMsg: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    // Add user message + update title optimistically
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== resolvedId) return s;
        const newMessages = [...s.messages, userMsg];
        return {
          ...s,
          messages: newMessages,
          title: deriveTitleFromMessages(newMessages, s.title),
        };
      }),
    );

    setActiveSessionId(resolvedId); // ensure UI shows correct session
    setMessageText("");
    setIsTyping(true);

    if (isFirstMessage) {
      generateSessionTitle(resolvedId, trimmed);
    }

    try {
      const res = await fetchWithAuth(`${BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ query: trimmed, session_id: resolvedId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || "Failed to send message");
      }

      const json = await res.json();
      const responseData = json.data ?? {};
      const content: string = responseData.message || json.message || "Here is what I found.";

      const aiMsg: ChatMessageType = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content,
        timestamp: new Date(),
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === resolvedId) {
            const updated = { ...s, messages: [...s.messages, aiMsg] };
            if (json.generated_title) {
              updated.title = json.generated_title;
            }
            return updated;
          }
          return s;
        }),
      );
    } catch (err) {
      const errMsg: ChatMessageType = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Could not connect. ${err instanceof Error ? err.message : "Please try again."}`,
        timestamp: new Date(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === resolvedId ? { ...s, messages: [...s.messages, errMsg] } : s,
        ),
      );
    } finally {
      setIsTyping(false);
    }
  }


  // ── Rename ──────────────────────────────────────────────────────────────
  function handleRename(sessionId: string) {
    const session = sessions.find((s) => s.id === sessionId);
    setRenameTarget({ id: sessionId, value: session?.title ?? "" });
    setActiveMenu(null);
  }

  async function submitRename() {
    if (!renameTarget) return;
    const title = renameTarget.value.trim();
    if (!title) return;
    setRenaming(true);
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/sessions/${renameTarget.id}?title=${encodeURIComponent(title)}`,
        { method: "PATCH" },
      );
      if (!res.ok) return;
      setSessions((prev) =>
        prev.map((s) => s.id === renameTarget.id ? { ...s, title } : s),
      );
      setRenameTarget(null);
    } catch (err) {
      console.error("Error renaming:", err);
    } finally {
      setRenaming(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────
  function handleDelete(sessionId: string) {
    const session = sessions.find((s) => s.id === sessionId);
    setDeleteTarget({ id: sessionId, title: session?.title ?? "this chat" });
    setActiveMenu(null);
  }

  async function submitDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`${BASE_URL}/sessions/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) return;
      const remaining = sessions.filter((s) => s.id !== deleteTarget.id);
      setSessions(remaining);
      if (activeSessionId === deleteTarget.id) setActiveSessionId(remaining[0]?.id ?? "");
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting:", err);
    } finally {
      setDeleting(false);
    }
  }

  function openMenu(e: MouseEvent<HTMLButtonElement>, sessionId: string) {
    e.stopPropagation();
    setActiveMenu(activeMenu === sessionId ? null : sessionId);
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <DashboardLayout activeNav="AI Chat">
      <div className="h-full bg-page text-slate-100 px-4 pt-8 pb-0 sm:px-6 lg:px-10 xl:px-12">
        <div className="mx-auto w-full h-full">
          <div className="h-full rounded-[32px] border border-slate-800/80 bg-slate-950/90 shadow-panel overflow-hidden flex flex-col">
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

              {/* ── Sidebar ── */}
              <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800/80 p-5 flex flex-col">
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

                <div className="mt-6 flex-1 overflow-y-auto space-y-3">
                  {sessions.map((session) => {
                    const active = session.id === activeSession?.id;
                    return (
                      <div key={session.id} className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveSessionId(session.id)}
                          className={`flex w-full items-center justify-between gap-3 rounded-3xl border px-4 py-4 text-left transition ${
                            active
                              ? "border-brand bg-slate-900 ring-2 ring-brand/20"
                              : "border-slate-800/80 bg-slate-950/90 hover:border-slate-600 hover:bg-slate-900"
                          }`}
                        >
                          <p className="truncate text-sm font-semibold text-white flex-1 min-w-0">
                            {session.title}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => openMenu(e, session.id)}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900 text-slate-400 transition hover:border-slate-600 hover:text-white"
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
                              className="mt-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm text-red-400 transition hover:bg-slate-900"
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
                <div className="border-b border-slate-800/90 p-6">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">AI Lead Assistant</p>
                  <h1 className="mt-3 text-2xl font-semibold text-white">
                    Ask, refine and qualify leads in Sri Lanka.
                  </h1>
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 sm:px-8">
                    <div className="flex flex-col gap-5">
                      {!activeSession || activeSession.messages.length === 0 ? (
                        <div className="grid min-h-[320px] place-items-center rounded-[28px] border border-dashed border-slate-800/90 bg-slate-900/70 p-10 text-center">
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
                      ) : (
                        activeSession.messages.map((message) => (
                          <ChatMessage key={message.id} message={message} />
                        ))
                      )}

                      {isTyping && (
                        <div className="rounded-[28px] border border-slate-800/90 bg-slate-900/90 p-5 text-sm text-slate-400">
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-4 w-4 animate-spin text-brand" />
                            AI is thinking...
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Input bar */}
                  <div className="border-t border-slate-800/90 bg-slate-950/95 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 rounded-full bg-slate-900/95 p-2">
                        <div className="flex items-center gap-3 rounded-full border border-slate-800/80 bg-slate-950 px-4 py-3">
                          <input
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                              }
                            }}
                            placeholder="Type your request for the AI assistant…"
                            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
                            aria-label="Type chat message"
                          />
                          <button
                            type="button"
                            onClick={handleSend}
                            disabled={isTyping || !messageText.trim()}
                            className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-brand text-slate-950 transition hover:bg-indigo-500 disabled:opacity-40"
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

      {/* Custom Rename Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-white">Rename chat session</h3>
            <input
              autoFocus
              value={renameTarget.value}
              onChange={(e) => setRenameTarget({ ...renameTarget, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); submitRename(); }
                if (e.key === "Escape") setRenameTarget(null);
              }}
              placeholder="Chat session name"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-brand"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                disabled={renaming}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRename}
                disabled={renaming || !renameTarget.value.trim()}
                className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {renaming && <Loader2 size={14} className="animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-900/50 bg-slate-950 p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold text-white">Delete chat session</h3>
            <p className="mb-6 text-sm text-slate-400">
              Are you sure you want to delete{' '}
              <span className="font-medium text-white">"{deleteTarget.title}"</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
