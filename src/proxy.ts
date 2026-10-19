import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

export function proxy(req: NextRequest) {
  const role = verifySession(req.cookies.get(SESSION_COOKIE)?.value)
  const onLogin = req.nextUrl.pathname === '/login'
  if (!role && !onLogin) return NextResponse.redirect(new URL('/login', req.url))
  if (role && onLogin) return NextResponse.redirect(new URL('/breakdown', req.url))
  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'] }
