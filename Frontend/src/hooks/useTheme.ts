import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

export type ThemeMode = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<ThemeMode>('theme', 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return [theme, setTheme] as const
}