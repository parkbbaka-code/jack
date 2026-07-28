import { randomBytes } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import {
  KAKAO_OAUTH_MAX_AGE_SECONDS,
  KAKAO_OAUTH_NEXT_COOKIE,
  KAKAO_OAUTH_STATE_COOKIE,
} from "@/lib/auth/constants";
import {
  createKakaoAuthorizeUrl,
  getKakaoRedirectUri,
  getSafeNextPath,
} from "@/lib/auth/kakao";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const state = randomBytes(32).toString("base64url");
    const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"));
    const redirectUri = getKakaoRedirectUri(request.url);
    const authorizeUrl = createKakaoAuthorizeUrl({ redirectUri, state });
    const response = NextResponse.redirect(authorizeUrl);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: KAKAO_OAUTH_MAX_AGE_SECONDS,
      path: "/api/auth/kakao",
    };

    response.cookies.set(KAKAO_OAUTH_STATE_COOKIE, state, cookieOptions);
    response.cookies.set(KAKAO_OAUTH_NEXT_COOKIE, nextPath, cookieOptions);

    return response;
  } catch (error) {
    console.error("Kakao authorization failed to start", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.redirect(new URL("/login?error=kakao_config", request.url));
  }
}
