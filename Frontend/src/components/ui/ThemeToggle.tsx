import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const [theme, setTheme] = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 999,
        border: '1px solid var(--color-border)',
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(61,59,243,0.08)',
        color: isDark ? 'var(--color-info)' : 'var(--color-brand)',
        cursor: 'pointer',
        transition: 'all 0.16s ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
