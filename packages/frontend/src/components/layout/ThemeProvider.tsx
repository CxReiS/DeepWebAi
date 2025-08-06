import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { resolvedThemeAtom } from '@/store/theme'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [resolvedTheme] = useAtom(resolvedThemeAtom)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
  }, [resolvedTheme])

  return <>{children}</>
}
