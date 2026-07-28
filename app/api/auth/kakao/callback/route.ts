import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import {
  KAKAO_CUSTOM_TOKEN_COOKIE,
  KAKAO_HANDOFF_NEXT_COOKIE,
  KAKAO_OAUTH_MAX_AGE_SECONDS,
  KAKAO_OAUTH_NEXT_COOKIE,
  KAKAO_OAUTH_STATE_COOKIE,
} from "@/lib/auth/constants";
import {
  createFirebaseCustomTokenFromKakao,
  getKakaoRedirectUri,
  getSafeNextPath,
} from "@/lib/auth/kakao";

export const runtime = "nodejs";

function statesMatch(expected: string | undefined, received: string | null) {
  if (!expected || !received) return false;

  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);

  return (
    expectedBytes.length === receivedBytes.length &&
    timingSafeEqual(expectedBytes, receivedBytes)
  );
}

function clearOAuthCookies(response: NextResponse) {
  for (const name of [KAKAO_OAUTH_STATE_COOKIE, KAKAO_OAUTH_NEXT_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/api/auth/kakao",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
}

function redirectToLogin(request: NextRequest, error: string) {
  const nextPath = getSafeNextPath(
    request.cookies.get(KAKAO_OAUTH_NEXT_COOKIE)?.value,
  );
  const url = new URL("/login", request.url);
  url.searchParams.set("next", nextPath);
  url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  clearOAuthCookies(response);
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(KAKAO_OAUTH_STATE_COOKIE)?.value;

  if (request.nextUrl.searchParams.has("error")) {
    return redirectToLogin(request, "kakao_cancelled");
  }

  if (!code || !statesMatch(expectedState, state)) {
    return redirectToLogin(request, "kakao_invalid_state");
  }

  try {
    const nextPath = getSafeNextPath(
      request.cookies.get(KAKAO_OAUTH_NEXT_COOKIE)?.value,
    );
    const { customToken } = await createFirebaseCustomTokenFromKakao({
      code,
      redirectUri: getKakaoRedirectUri(request.url),
    });
    const response = NextResponse.redirect(
      new URL("/login/kakao/complete", request.url),
    );
    const handoffCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: KAKAO_OAUTH_MAX_AGE_SECONDS,
      path: "/api/auth/kakao/token",
    };

    clearOAuthCookies(response);
    response.cookies.set(
      KAKAO_CUSTOM_TOKEN_COOKIE,
      customToken,
      handoffCookieOptions,
    );
    response.cookies.set(
      KAKAO_HANDOFF_NEXT_COOKIE,
      nextPath,
      handoffCookieOptions,
    );

    return response;
  } catch (error) {
    console.error("Kakao callback failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return redirectToLogin(request, "kakao_failed");
  }
}
