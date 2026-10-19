'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const d = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches
    document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light')
    setDark(d)
  }, [])
  return (
    <button
      className="ib"
      aria-label="Ganti tema"
      onClick={() => {
        const next = !dark
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
        localStorage.setItem('theme', next ? 'dark' : 'light')
        setDark(next)
      }}
    >
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  )
}
