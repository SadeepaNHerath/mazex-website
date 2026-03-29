import { NextResponse } from "next/server";
import { getDelegateBookletHref } from "@/lib/site-resources";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const bookletHref = await getDelegateBookletHref();
  const redirectUrl = new URL(bookletHref, request.url);
  const response = NextResponse.redirect(redirectUrl, { status: 307 });

  response.headers.set("Cache-Control", "no-store");

  return response;
}
