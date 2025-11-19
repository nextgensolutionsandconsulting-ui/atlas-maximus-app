// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(_request: NextRequest) {
  const res = NextResponse.next()

  // Content Security Policy - simplified without D-ID
  const csp = [
    "default-src 'self'",
    // Allow scripts with Cloudflare Insights
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
    // API + Stripe + analytics
    "connect-src 'self' https://*.stripe.com https://cloudflareinsights.com",
    // Images from Stripe + data/blob for local content
    "img-src 'self' data: blob: https://*.stripe.com",
    // Stripe payment frames
    "frame-src https://*.stripe.com",
    // Allow inline styles + Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Google Fonts
    "font-src 'self' data: https://fonts.gstatic.com",
    // Media sources
    "media-src 'self' blob:",
  ].join('; ')

  res.headers.set('Content-Security-Policy', csp)
  return res
}

export const config = {
  matcher: [
    // apply to everything except Next static assets & favicon
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
