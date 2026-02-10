// this is a reserved file for next which basically is run before each page load.
// this file will check that a user is logged in to the supabase to prevent users from going on
// personal pages.

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(req: NextRequest) {
    const sb_token = req.cookies.get("sb_access_token")

    // given there is a user attempting to go on any of the following pages, the next logic will
    // apply.
    const protectedRoutes = ["/dashboard"]

    if (
        protectedRoutes.some(path =>
            req.nextUrl.pathname.startsWith(path)
        )
    ) {
        if (!sb_token) {
            return NextResponse.redirect(
                new URL("/login", req.url)
            )
        }
    }
}