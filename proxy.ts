// this is a reserved file for next which basically is run before each page load.
// this file will check that a user is logged in to the supabase to prevent users from going on
// personal pages.

import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  // refer to @/lib/supabase/proxy if you need to edit the redirect.
  return await updateSession(request)
}

export const config = {
  matcher: [
    "/dashboard",
    "/onboarding",
  ],
}