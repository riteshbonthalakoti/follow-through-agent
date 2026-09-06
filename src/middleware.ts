import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_PATHS = ['/', '/login', '/auth', '/api/auth']
const PROTECTED_PREFIX = ['/dashboard', '/loops', '/settings']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let public paths and API routes through (except protected ones)
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isProtected = PROTECTED_PREFIX.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isApi = pathname.startsWith('/api/')

  if (isApi || (!isPublic && !isProtected)) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Authenticated user hitting login → send to dashboard
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Unauthenticated user hitting protected route → send to login
  if (!session && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg|icons|sw.js|manifest.webmanifest).*)'],
}
