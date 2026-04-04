import { NextRequest, NextResponse } from "next/server";
import { buildAppUrl } from "@/lib/app-url";
import { getCurrentAdmin } from "@/lib/admin-auth";
import {
  buildGoogleSheetsOAuthUrl,
  isGoogleSheetsOAuthConfigured,
  normalizeGoogleSheetsReturnToPath,
} from "@/lib/google-sheets";

export const runtime = "nodejs";

const GOOGLE_SHEETS_OAUTH_STATE_COOKIE = "mazex_google_sheets_oauth_state";

function buildStateCookieValue(payload: {
  state: string;
  adminUserId: string;
  returnTo: string;
}) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export async function GET(request: NextRequest) {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) {
    return NextResponse.redirect(buildAppUrl(request, "/login?reason=unauthorized"));
  }

  const returnTo = normalizeGoogleSheetsReturnToPath(
    request.nextUrl.searchParams.get("returnTo"),
  );
  if (!isGoogleSheetsOAuthConfigured()) {
    return NextResponse.redirect(buildAppUrl(request, returnTo));
  }

  const state = crypto.randomUUID();
  const redirectUri = buildAppUrl(
    request,
    "/api/admin/google-sheets/callback",
  ).toString();
  const response = NextResponse.redirect(
    buildGoogleSheetsOAuthUrl({
      redirectUri,
      state,
    }),
  );

  response.cookies.set(
    GOOGLE_SHEETS_OAUTH_STATE_COOKIE,
    buildStateCookieValue({
      state,
      adminUserId: currentAdmin.user.$id,
      returnTo,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    },
  );

  return response;
}
