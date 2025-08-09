import { useAtom } from 'jotai'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from './Button'
import { themeAtom, type Theme } from '@/store/theme'
import { cn } from '@/utils/cn'

export function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom)

  const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun className="h-4 w-4" />, label: 'Light' },
    { value: 'dark', icon: <Moon className="h-4 w-4" />, label: 'Dark' },
    { value: 'system', icon: <Monitor className="h-4 w-4" />, label: 'System' },
  ]

  const currentTheme = themes.find(t => t.value === theme) || themes[2]

  const handleThemeChange = () => {
    const currentIndex = themes.findIndex(t => t.value === theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex]!.value)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleThemeChange}
      className={cn(
        'relative h-9 w-9',
        'hover:bg-accent hover:text-accent-foreground',
        'transition-all duration-200'
      )}
      title={`Switch to ${themes[(themes.findIndex(t => t.value === theme) + 1) % themes.length]!.label} theme`}
    >
      <div className="transition-transform duration-200">
        {currentTheme.icon}
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
