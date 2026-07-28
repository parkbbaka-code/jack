import { NextResponse, type NextRequest } from "next/server";

import {
  KAKAO_CUSTOM_TOKEN_COOKIE,
  KAKAO_HANDOFF_NEXT_COOKIE,
  KAKAO_NEW_USER_COOKIE,
} from "@/lib/auth/constants";
import { getSafeNextPath } from "@/lib/auth/kakao";

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const customToken = request.cookies.get(KAKAO_CUSTOM_TOKEN_COOKIE)?.value;

  if (!customToken) {
    return NextResponse.json({ error: "Login expired" }, { status: 401 });
  }

  const response = NextResponse.json({
    customToken,
    isNewUser: request.cookies.get(KAKAO_NEW_USER_COOKIE)?.value === "1",
    nextPath: getSafeNextPath(
      request.cookies.get(KAKAO_HANDOFF_NEXT_COOKIE)?.value,
    ),
  });

  for (const name of [
    KAKAO_CUSTOM_TOKEN_COOKIE,
    KAKAO_NEW_USER_COOKIE,
    KAKAO_HANDOFF_NEXT_COOKIE,
  ]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/api/auth/kakao/token",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
