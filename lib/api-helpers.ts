import { NextResponse } from "next/server"
import { isMasterAuthed } from "@/lib/master-auth"

/** Returns a 401 response if not master-authed, null if OK. */
export async function assertMasterAuth(): Promise<NextResponse | null> {
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

/** Shorthand for a JSON error response. */
export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

/** Parses JSON body safely, returns null on failure. */
export async function parseBody<T = unknown>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}
