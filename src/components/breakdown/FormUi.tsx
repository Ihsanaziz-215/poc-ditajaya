'use client'

import { createContext, useContext, useState } from 'react'

/** Shares "which items were missing price/supplier on the last Kirim ke Sales attempt" between header action and items table. */
const Ctx = createContext<{ missing: Set<string>; setMissing: (s: Set<string>) => void }>({ missing: new Set(), setMissing: () => {} })

export function FormUiProvider({ children }: { children: React.ReactNode }) {
  const [missing, setMissing] = useState<Set<string>>(new Set())
  return <Ctx.Provider value={{ missing, setMissing }}>{children}</Ctx.Provider>
}
export const useFormUi = () => useContext(Ctx)
