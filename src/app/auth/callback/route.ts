import { NextResponse } from 'next/server'

// Redirect to the client-side handler which can access both query params
// and the hash fragment (access_token from implicit flow).
export async function GET(request: Request) {
  const { search, hash } = new URL(request.url)
  const destination = `/auth/confirm${search}${hash}`
  return NextResponse.redirect(new URL(destination, request.url))
}
