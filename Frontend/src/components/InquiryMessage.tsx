import { BadgeCheck, MessageSquare } from 'lucide-react'

export function InquiryMessage({ message }: { message: string }) {
  if (!message) return null

  const parts = message.split('--- Qualification Data ---')
  const userMessage = parts[0].trim()
  const qualDataRaw = parts.length > 1 ? parts[1].trim() : null

  const qualLines = qualDataRaw 
    ? qualDataRaw.split('\n').map(line => line.trim()).filter(Boolean)
    : []

  return (
    <div className="space-y-4">
      {userMessage && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            <MessageSquare size={14} /> Message
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap italic bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            "{userMessage}"
          </p>
        </div>
      )}
      
      {qualLines.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
            <BadgeCheck size={14} /> Qualification Data
          </div>
          <div className="flex flex-wrap gap-2">
            {qualLines.map((line, idx) => {
              const splitIdx = line.indexOf(':')
              if (splitIdx === -1) return null
              const key = line.slice(0, splitIdx).trim()
              const val = line.slice(splitIdx + 1).trim()
              return (
                <div key={idx} className="flex flex-col bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-lg px-3 py-1.5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-emerald-600/70 dark:text-emerald-400/70">{key}</span>
                  <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">{val}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
