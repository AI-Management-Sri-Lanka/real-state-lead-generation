import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface SelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
}

export function Select({ label, value, onChange, options, placeholder }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      >
        <span className={value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}>
          {value || placeholder || 'Select an option...'}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full origin-top rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg shadow-slate-200/50 outline-none animate-in fade-in slide-in-from-top-2 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/30">
          <ul className="max-h-60 overflow-y-auto">
            {placeholder && (
              <li>
                <button
                  type="button"
                  onClick={() => { onChange(''); setIsOpen(false) }}
                  className={`flex w-full items-center px-4 py-2.5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-700 ${!value ? 'bg-indigo-50/50 text-indigo-700 font-medium dark:bg-indigo-950/40 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  <span className="flex-1 text-left">{placeholder}</span>
                  {!value && <Check size={16} className="text-indigo-600 dark:text-indigo-400" />}
                </button>
              </li>
            )}

            {options.filter(Boolean).map(option => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => { onChange(option); setIsOpen(false) }}
                  className={`flex w-full items-center px-4 py-2.5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-700 ${value === option ? 'bg-indigo-50/50 text-indigo-700 font-medium dark:bg-indigo-950/40 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}
                >
                  <span className="flex-1 text-left">{option}</span>
                  {value === option && <Check size={16} className="text-indigo-600 dark:text-indigo-400" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
