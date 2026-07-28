import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

const KAKAO_AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";
const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const KAKAO_USER_URL = "https://kapi.kakao.com/v2/user/me";

type KakaoTokenResponse = {
  access_token?: string;
};

type KakaoUserResponse = {
  id?: number | string;
  kakao_account?: {
    profile?: {
      nickname?: string;
    };
  };
};

function requiredEnvironment(name: "KAKAO_REST_API_KEY" | "KAKAO_CLIENT_SECRET") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function getSafeNextPath(candidate: string | null | undefined) {
  if (!candidate?.startsWith("/") || candidate.startsWith("//")) {
    return "/wishtree";
  }

  return candidate;
}

export function getKakaoRedirectUri(requestUrl: string) {
  return (
    process.env.KAKAO_REDIRECT_URI?.trim() ||
    new URL("/api/auth/kakao/callback", requestUrl).toString()
  );
}

export function createKakaoAuthorizeUrl({
  redirectUri,
  state,
}: {
  redirectUri: string;
  state: string;
}) {
  const url = new URL(KAKAO_AUTHORIZE_URL);
  url.searchParams.set("client_id", requiredEnvironment("KAKAO_REST_API_KEY"));
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url;
}

async function requestKakaoAccessToken({
  code,
  redirectUri,
}: {
  code: string;
  redirectUri: string;
}) {
  const response = await fetch(KAKAO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: requiredEnvironment("KAKAO_REST_API_KEY"),
      client_secret: requiredEnvironment("KAKAO_CLIENT_SECRET"),
      redirect_uri: redirectUri,
      code,
    }),
    cache: "no-store",
  });
  const result = (await response.json()) as KakaoTokenResponse;

  if (!response.ok || !result.access_token) {
    throw new Error(`Kakao token exchange failed (${response.status}).`);
  }

  return result.access_token;
}

async function requestKakaoUser(accessToken: string) {
  const response = await fetch(KAKAO_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    cache: "no-store",
  });
  const result = (await response.json()) as KakaoUserResponse;

  if (!response.ok || result.id === undefined) {
    throw new Error(`Kakao user request failed (${response.status}).`);
  }

  return result;
}

function getKakaoDisplayName(user: KakaoUserResponse) {
  const nickname = user.kakao_account?.profile?.nickname?.trim();
  return nickname ? nickname.slice(0, 128) : "이루리 사용자";
}

export async function createFirebaseCustomTokenFromKakao({
  code,
  redirectUri,
}: {
  code: string;
  redirectUri: string;
}) {
  const accessToken = await requestKakaoAccessToken({ code, redirectUri });
  const kakaoUser = await requestKakaoUser(accessToken);
  const uid = `kakao:${String(kakaoUser.id)}`;
  const displayName = getKakaoDisplayName(kakaoUser);
  const auth = getFirebaseAdminAuth();
  let isNewUser = false;

  try {
    const existing = await auth.getUser(uid);

    if (existing.displayName !== displayName) {
      await auth.updateUser(uid, { displayName });
    }
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String(error.code)
        : "";

    if (code !== "auth/user-not-found") throw error;

    try {
      await auth.createUser({ uid, displayName });
      isNewUser = true;
    } catch (createError) {
      const createCode =
        typeof createError === "object" && createError && "code" in createError
          ? String(createError.code)
          : "";

      if (createCode !== "auth/uid-already-exists") throw createError;
    }
  }

  const customToken = await auth.createCustomToken(uid, {
    authProvider: "kakao",
  });

  return { customToken, isNewUser };
}
