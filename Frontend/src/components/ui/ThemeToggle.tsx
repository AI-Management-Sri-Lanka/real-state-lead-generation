import { Moon, Sun } from 'lucide-react'
import { ThemeMode, useTheme } from '@/hooks/useTheme'

type ThemeToggleProps = {
  theme?: ThemeMode
  setTheme?: (theme: ThemeMode) => void
  whiteIcon?: boolean
}

export function ThemeToggle({ theme: propTheme, setTheme: propSetTheme, whiteIcon = false }: ThemeToggleProps) {
  const hasPropTheme = propTheme !== undefined && propSetTheme !== undefined
  const [internalTheme, internalSetTheme] = useTheme()
  const activeTheme = hasPropTheme ? propTheme : internalTheme
  const activeSetTheme = hasPropTheme ? propSetTheme : internalSetTheme
  const isDark = activeTheme === 'dark'

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => activeSetTheme(isDark ? 'light' : 'dark')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 999,
        border: whiteIcon ? '1px solid rgba(0,0,0,0.6)' : `1px solid ${isDark ? '#334155' : '#E2E2F0'}`,
        background: whiteIcon ? 'rgba(0,0,0,0.25)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(61,59,243,0.08)'),
        color: whiteIcon ? '#ffffff' : (isDark ? '#f8fafc' : '#3D3BF3'),
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
