import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export type Theme = 'light' | 'dark' | 'system'

export const themeAtom = atomWithStorage<Theme>('theme', 'system')

export const resolvedThemeAtom = atom((get) => {
  const theme = get(themeAtom)
  
  if (theme === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  }
  
  return theme
})

export const isDarkModeAtom = atom((get) => {
  return get(resolvedThemeAtom) === 'dark'
})

export const toggleThemeAtom = atom(
  null,
  (get, set) => {
    const currentTheme = get(themeAtom)
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    set(themeAtom, newTheme)
  }
)
