import { useEffect, useRef, useMemo, useState, useCallback, type MouseEvent } from "react";
import { Loader2, Plus, Search, Send, MoreVertical, Trash2, Edit2, ExternalLink, MapPin, Calendar, Tag, User } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatMessage } from "@/components/dashboard/ChatMessage";
import { useAuth } from "@/hooks/useAuth";
import { fetchWithAuth } from "@/api/authApi";

type Lead = {
  userId?: string;
  username?: string;
  name?: string;
  platform: string;
  property_type?: string;
  location?: string;
  date?: string;
  description?: string;
  post_link?: string;
};

type ChatMessageType = {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  leads?: Lead[];
};

type Session = {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessageType[];
};

const BASE_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/api/v1`;

function deriveTitleFromMessages(messages: ChatMessageType[], fallback: string): string {
  const isFallbackDefault = !fallback || fallback.toLowerCase() === "new chat";
  if (!isFallbackDefault) return fallback;
  const first = messages.find((m) => m.role === "user" && m.content.trim());
  if (!first) return fallback || "New chat";
  const snippet = first.content.trim().replace(/\s+/g, " ");
  return snippet.length > 30 ? `${snippet.slice(0, 30)}...` : snippet;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  tiktok: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  facebook: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  twitter: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  linkedin: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
};

function getPlatformStyle(platform: string) {
  return PLATFORM_COLORS[platform?.toLowerCase()] ?? "bg-slate-700/40 text-slate-300 border-slate-600/40";
}

function LeadCard({ lead, index }: { lead: Lead; index: number }) {
  const handle = lead.userId || lead.username || "unknown";
  const displayName = lead.name && lead.name !== handle ? lead.name : null;
  const platformStyle = getPlatformStyle(lead.platform);
  const formattedDate = lead.date
    ? new Date(lead.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;
  const shortDesc = lead.description
    ? lead.description.length > 180
      ? lead.description.substring(0, 180) + "…"
      : lead.description
    : null;

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4 flex flex-col gap-3 hover:border-slate-600/80 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xs font-bold text-brand">
            {index}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">@{handle}</p>
            {displayName && (
              <p className="truncate text-xs text-slate-400">{displayName}</p>
            )}
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${platformStyle}`}>
          {lead.platform}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {lead.property_type && lead.property_type !== "unknown" && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Tag size={11} className="text-slate-500" />
            <span className="capitalize">{lead.property_type}</span>
          </div>
        )}
        {lead.location && lead.location !== "null" && lead.location !== "unknown" && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin size={11} className="text-slate-500" />
            <span>{lead.location}</span>
          </div>
        )}
        {formattedDate && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={11} className="text-slate-500" />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>

      {/* Post excerpt */}
      {shortDesc && (
        <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2.5 line-clamp-3">
          "{shortDesc}"
        </p>
      )}

      {/* Link */}
      {lead.post_link && (
        <a
          href={lead.post_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand/10 border border-brand/20 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/20 transition-colors w-fit"
        >
          <ExternalLink size={11} />
          View post
        </a>
      )}
    </div>
  );
}

function LeadsGrid({ leads }: { leads: Lead[] }) {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {leads.length} lead{leads.length !== 1 ? "s" : ""} found
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {leads.map((lead, i) => (
          <LeadCard key={`${lead.userId}-${i}`} lead={lead} index={i + 1} />
        ))}
      </div>
    </div>
  );
}

// Decide whether the backend's message text is just a generic/empty
// placeholder (so we should replace it with an honest "no leads" message)
// vs. a specific error/explanation we should preserve as-is.
function isGenericNoResultsMessage(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return true;
  if (trimmed === "Here is what I found.") return true;
  if (/no leads/i.test(trimmed)) return true;
  if (/\b0\s*\/\s*\d+\b/.test(trimmed)) return true;
  if (/could not find|did not find|couldn't find/i.test(trimmed)) return true;
  return false;
}

const NO_LEADS_MESSAGE =
  "I couldn't find any leads matching that search right now. This can happen if the data sources have hit their usage limit for the month, or if there's just nothing matching those filters today. Try a different platform, location, or hashtag, or check back later.";

function parseLeadsFromBakedContent(content: string): { intro: string; leads: Lead[] } {
  const introMatch = content.match(/^([\s\S]*?)(?=\*\*\d+\.)/);
  let intro = introMatch ? introMatch[1].trim() : "";
  intro = intro.replace(/\*\*Found \d+ potential leads:\*\*/i, "").trim();
  if (!intro) intro = "Here are the leads I found for you";

  const blocks = content.split(/(?=\*\*\d+\.\s+@)/).slice(1);
  const leads = blocks
    .map((block) => {
      const handleMatch = block.match(/\*\*\d+\.\s+(@[\w.]+)\*\*\s*\((\w+)\)/);
      const nameMatch = block.match(/Name:\s*(.+)/);
      const propMatch = block.match(/Property Type:\s*(.+)/);
      const locMatch = block.match(/Location:\s*(.+)/);
      const dateMatch = block.match(/Date:\s*(.+)/);
      const descMatch = block.match(/Post:\s*"?([\s\S]+?)(?="?\s*\n\s*(?:Link:|$))/);
      const linkMatch = block.match(/Link:\s*(https?:\/\/\S+)/);
      return {
        userId: handleMatch?.[1]?.replace("@", "") ?? "unknown",
        platform: handleMatch?.[2] ?? "unknown",
        name: nameMatch?.[1]?.trim(),
        property_type: propMatch?.[1]?.trim(),
        location: locMatch?.[1]?.trim(),
        date: dateMatch?.[1]?.trim(),
        description: descMatch?.[1]?.trim(),
        post_link: linkMatch?.[1]?.trim(),
      } as Lead;
    })
    .filter((l: Lead) => l.userId !== "unknown");

  return { intro, leads };
}

export default function AIChat() {
  const { user } = useAuth();
  const userName = (user as any)?.name || (user as any)?.email || "You";

  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const stored = localStorage.getItem("leadai_sessions");
      return stored ? JSON.parse(stored, (key, val) => {
        if (key === "timestamp" || key === "createdAt") return val; // keep as string, convert on use
        return val;
      }) : [];
    } catch { return []; }
  });

  // Persist sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("leadai_sessions", JSON.stringify(sessions));
    } catch { /* quota exceeded or private mode */ }
  }, [sessions]);

  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, isTyping, activeSessionId]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? sessions[0] ?? null,
    [sessions, activeSessionId],
  );

  // ── Load sessions on mount ──────────────────────────────────────────────
  const sessionsLoadedRef = useRef(false);
  useEffect(() => {
    if (!user || sessionsLoadedRef.current) return;
    sessionsLoadedRef.current = true;
    async function loadSessions() {
      try {
        const res = await fetchWithAuth(`${BASE_URL}/sessions`);
        if (!res.ok) return;
        const data = await res.json();
        setSessions((prev) => {
          const mapped: Session[] = data.map((s: any) => {
            const existing = prev.find((p) => p.id === s.session_id);
            return {
              id: s.session_id,
              title: s.title || existing?.title || "New chat",
              createdAt: new Date(s.updated_at).toLocaleDateString(undefined, {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              }),
              // Preserve cached messages (with leads) if we already have them
              messages: existing?.messages ?? [],
            };
          });
          // Keep any local-only sessions (not yet known to backend, e.g. just created) at the front
          const backendIds = new Set(mapped.map((m) => m.id));
          const localOnly = prev.filter((p) => !backendIds.has(p.id));
          return [...localOnly, ...mapped];
        });
        setActiveSessionId((prevId) => prevId || (data.length > 0 ? data[0].session_id : ""));
      } catch (err) {
        console.error("Error loading sessions:", err);
      }
    }
    loadSessions();
  }, [user]);

  // ── Load messages when active session changes ───────────────────────────
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  const loadedSessionsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!activeSessionId) return;
    if (loadedSessionsRef.current.has(activeSessionId)) return;

    // Read the LATEST sessions via ref, not the effect's stale closure
    const cached = sessionsRef.current.find((s) => s.id === activeSessionId);
    if (cached && cached.messages.length > 0) {
      loadedSessionsRef.current.add(activeSessionId);
      // Ensure timestamps are Date objects (localStorage stores them as strings)
      setSessions((prev) => prev.map((s) =>
        s.id !== activeSessionId ? s : {
          ...s,
          messages: s.messages.map((m) => ({
            ...m,
            timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp),
          })),
        }
      ));
      return;
    }

    loadedSessionsRef.current.add(activeSessionId);

    async function loadMessages() {
      try {
        const res = await fetchWithAuth(`${BASE_URL}/sessions/${activeSessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        const messages: ChatMessageType[] = (data.messages ?? []).map((m: any) => {
          let content: string = m.content ?? "";
          let leads: Lead[] = [];

          // Parse leads out of baked-in markdown if backend stored them as text
          if (m.role === "assistant") {
            // Match both "**Found N potential leads:**" and numbered lead blocks like "**1. @handle** (platform)"
            const hasLeadBlock = /\*\*\d+\.\s+@/.test(content);
            if (hasLeadBlock) {
              const parsed = parseLeadsFromBakedContent(content);
              if (parsed.leads.length > 0) {
                leads = parsed.leads;
                content = parsed.intro;
              }
            }
          }

          return {
            id: m.id ?? `${Date.now()}-${Math.random()}`,
            role: m.role as "user" | "assistant",
            content,
            timestamp: new Date(m.timestamp),
            leads: leads.length > 0 ? leads : undefined,
          };
        });
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

    setActiveSessionId(resolvedId);
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
      let leads: Lead[] = responseData.leads ?? [];

      // Strip the lead list block from the text — cards render it instead
      let content: string = responseData.message || json.message || "Here is what I found.";
      if (leads.length > 0) {
        // Remove everything from "**Found N potential leads:**" onward
        content = content.replace(/\*\*Found \d+ potential leads:\*\*[\s\S]*/i, "").trim();
        if (!content) content = "Here are the leads I found for you";
      }

      // Fallback: if backend bakes everything into the message string, parse leads from it
      if (leads.length === 0 && /\*\*\d+\.\s+@/.test(content)) {
        const parsed = parseLeadsFromBakedContent(content);
        if (parsed.leads.length > 0) {
          leads = parsed.leads;
          content = parsed.intro;
        }
      }

      // Honest empty-state: if there are genuinely no leads, don't show a
      // message that implies success. Preserve specific backend error text
      // if it gave one; otherwise show a clear explanation.
      if (leads.length === 0 && isGenericNoResultsMessage(content)) {
        content = NO_LEADS_MESSAGE;
      }

      const aiMsg: ChatMessageType = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content,
        timestamp: new Date(),
        leads: leads.length > 0 ? leads : undefined,
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
  async function handleRename(sessionId: string) {
    const session = sessions.find((s) => s.id === sessionId);
    const title = window.prompt("Rename chat session", session?.title ?? "");
    if (!title?.trim()) return;
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/sessions/${sessionId}?title=${encodeURIComponent(title.trim())}`,
        { method: "PATCH" },
      );
      if (!res.ok) return;
      setSessions((prev) =>
        prev.map((s) => s.id === sessionId ? { ...s, title: title.trim() } : s),
      );
      setActiveMenu(null);
    } catch (err) {
      console.error("Error renaming:", err);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────
  async function handleDelete(sessionId: string) {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) return;
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (activeSessionId === sessionId) setActiveSessionId(remaining[0]?.id ?? "");
      setActiveMenu(null);
    } catch (err) {
      console.error("Error deleting:", err);
    }
  }

  function openMenu(e: MouseEvent<HTMLButtonElement>, sessionId: string) {
    e.stopPropagation();
    setActiveMenu(activeMenu === sessionId ? null : sessionId);
  }

 // ── Render ──────────────────────────────────────────────────────────────
  return (
    <DashboardLayout activeNav="AI Chat">
      <div className="h-screen max-h-screen bg-slate-950 text-slate-100 overflow-hidden">
        <div className="w-full h-full overflow-hidden">
          <div className="h-full bg-slate-950 overflow-hidden flex flex-col">
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

              {/* ── Sidebar (fixed, never scrolls/resizes with chat) ── */}
              <div className="w-full lg:w-80 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/80 p-5 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between gap-3 shrink-0">
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

                <div className="mt-6 flex-1 min-h-0 overflow-y-auto space-y-3">
                  {sessions.map((session) => {
                    const active = session.id === activeSession?.id;
                    return (
                      <div key={session.id} className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveSessionId(session.id)}
                          className={`group flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition border ${
                            active
                              ? "border-brand/30 bg-slate-800/70"
                              : "border-transparent hover:bg-slate-800/40"
                          }`}
                        >
                          <p className="truncate text-sm font-semibold text-white flex-1 min-w-0">
                            {session.title}
                          </p>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => openMenu(e as any, session.id)}
                            onKeyDown={(e) => e.key === "Enter" && openMenu(e as any, session.id)}
                            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900 text-slate-400 transition hover:border-slate-600 hover:text-white cursor-pointer opacity-0 group-hover:opacity-100 ${activeMenu === session.id ? "opacity-100" : ""}`}
                          >
                            <MoreVertical size={16} />
                          </div>
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

              {/* ── Main chat area (only this part scrolls) ── */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="border-b border-slate-800/90 px-6 py-4 shrink-0">
                  <p className="text-xs font-medium tracking-wide text-slate-500">AI LEAD ASSISTANT</p>
                  <h1 className="mt-1 text-xl font-medium text-white">
                    Ask, refine and qualify leads.
                  </h1>
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {/* Messages — the ONLY scrollable region */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-4 sm:px-8">
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
                          <div key={message.id} className="flex flex-col">
                            <ChatMessage message={{ id: message.id, role: message.role, content: message.content, timestamp: message.timestamp, isTyping: message.isTyping }} userName={userName} />
                            {message.leads && message.leads.length > 0 && (
                              <LeadsGrid leads={message.leads} />
                            )}
                          </div>
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

                  {/* Input bar (fixed at the bottom of the chat column) */}
                  <div className="border-t border-slate-800/90 bg-slate-950/95 px-5 py-4 sm:px-6 shrink-0">
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
                            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none border-none ring-0 focus:outline-none focus:ring-0 focus:border-none appearance-none"
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
    </DashboardLayout>
  );
}