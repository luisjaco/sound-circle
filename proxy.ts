// this is a reserved file for next which basically is run before each page load.
// this file will check that a user is logged in to the supabase to prevent users from going on
// personal pages.

import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/dashboard",
    "/onboarding",
  ],
}