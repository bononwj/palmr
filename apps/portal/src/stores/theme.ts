import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export type Theme = 'light' | 'dark' | 'system'

// Theme atom persisted to localStorage
export const themeAtom = atomWithStorage<Theme>('theme', 'system')

// Derived atom for actual theme (resolves 'system' to light/dark)
export const actualThemeAtom = atom((get) => {
  const theme = get(themeAtom)
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
})

// Toggle theme action
export const toggleThemeAtom = atom(
  null,
  (get, set) => {
    const currentTheme = get(themeAtom)
    const nextTheme: Theme = currentTheme === 'light' ? 'dark' : 'light'
    set(themeAtom, nextTheme)
  }
)

