'use client'

import { useSyncExternalStore } from 'react'
import { Icon } from '@/components/ui/Icon'

const listeners = new Set<() => void>()
const isDark = () => {
  const saved = localStorage.getItem('theme')
  return saved ? saved === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches
}
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  document.documentElement.setAttribute('data-theme', isDark() ? 'dark' : 'light')
  return () => { listeners.delete(fn) }
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false)
  return (
    <button
      className="ib"
      aria-label="Ganti tema"
      onClick={() => {
        const next = !dark
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
        localStorage.setItem('theme', next ? 'dark' : 'light')
        listeners.forEach((f) => f())
      }}
    >
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  )
}
