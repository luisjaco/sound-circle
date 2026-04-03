// this is a reserved file for next which basically is run before each page load.
// this file will check that a user is logged in to the supabase to prevent users from going on
// personal pages.

import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  // skip root check.
  const { pathname } = request.nextUrl
  if (pathname === '/') return;

  // refer to @/lib/supabase/proxy if you need to edit the redirect.
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - login
     * - signup
     * - root (handled in proxy function itself.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|login|signup).*)',
  ],
}