import { useEffect, ReactNode } from 'react'
import { ConfigProvider, theme as antTheme, App } from 'antd'
import { useAtomValue } from 'jotai'
import { actualThemeAtom } from '@/stores/theme'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const actualTheme = useAtomValue(actualThemeAtom)
  const isDark = actualTheme === 'dark'

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(actualTheme)
  }, [actualTheme])

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <App>
        {children}
      </App>
    </ConfigProvider>
  )
}

