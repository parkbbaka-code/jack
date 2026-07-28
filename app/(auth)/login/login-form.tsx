"use client";

import { type FormEvent, useState } from "react";
import type { User } from "firebase/auth";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

type Mode = "signin" | "signup";

function getAuthErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  const messages: Record<string, string> = {
    "auth/account-exists-with-different-credential":
      "같은 이메일로 가입한 다른 로그인 방법이 있습니다.",
    "auth/email-already-in-use": "이미 가입된 이메일입니다.",
    "auth/invalid-credential": "이메일 또는 비밀번호를 확인해주세요.",
    "auth/invalid-email": "올바른 이메일 주소를 입력해주세요.",
    "auth/popup-blocked":
      "팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.",
    "auth/popup-closed-by-user": "Google 로그인 창이 닫혔습니다.",
    "auth/too-many-requests": "잠시 후 다시 시도해주세요.",
    "auth/unauthorized-domain":
      "현재 서비스 주소가 Firebase에 승인되지 않았습니다.",
    "auth/weak-password": "비밀번호는 6자 이상 입력해주세요.",
  };

  return (
    messages[code] ?? "로그인 중 문제가 생겼습니다. 잠시 후 다시 시도해주세요."
  );
}

async function createServerSession(user: User, nextPath: string) {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error("session-exchange-failed");
  }

  window.location.assign(nextPath);
}

function getSafeNextPath() {
  const candidate = new URLSearchParams(window.location.search).get("next");

  if (!candidate?.startsWith("/") || candidate.startsWith("//")) {
    return "/wishtree";
  }

  return candidate;
}

async function getAuthClient() {
  const [client, firebaseAuth] = await Promise.all([
    import("@/lib/firebase/client"),
    import("firebase/auth"),
  ]);

  return {
    auth: client.getFirebaseClientServices().auth,
    firebaseAuth,
  };
}

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "google" | "email" | "reset" | null
  >(null);

  const isPending = pendingAction !== null;

  async function handleGoogleSignIn() {
    setPendingAction("google");

    try {
      const { auth, firebaseAuth } = await getAuthClient();
      const provider = new firebaseAuth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await firebaseAuth.signInWithPopup(auth, provider);
      await createServerSession(credential.user, getSafeNextPath());
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
      setPendingAction(null);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("email");

    try {
      const { auth, firebaseAuth } = await getAuthClient();
      const credential =
        mode === "signin"
          ? await firebaseAuth.signInWithEmailAndPassword(auth, email, password)
          : await firebaseAuth.createUserWithEmailAndPassword(
              auth,
              email,
              password,
            );

      await createServerSession(credential.user, getSafeNextPath());
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
      setPendingAction(null);
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      toast.info("먼저 이메일 주소를 입력해주세요.");
      return;
    }

    setPendingAction("reset");

    try {
      const { auth, firebaseAuth } = await getAuthClient();
      await firebaseAuth.sendPasswordResetEmail(auth, email);
      toast.success("비밀번호 재설정 메일을 보냈습니다.");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mt-8">
      <button
        className="button-secondary w-full gap-2 disabled:cursor-wait disabled:opacity-60"
        disabled={isPending}
        onClick={handleGoogleSignIn}
        type="button"
      >
        {pendingAction === "google" && (
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
        )}
        Google로 계속하기
      </button>

      <div className="my-6 flex items-center gap-3" role="separator">
        <span className="bg-forest/10 h-px flex-1" />
        <span className="text-sub text-xs">또는 이메일로</span>
        <span className="bg-forest/10 h-px flex-1" />
      </div>

      <form className="space-y-4" onSubmit={handleEmailSubmit}>
        <label className="block">
          <span className="text-forest text-sm font-medium">이메일</span>
          <input
            autoComplete="email"
            className="border-forest/15 text-forest placeholder:text-sub/50 focus:border-canopy mt-2 min-h-12 w-full rounded-2xl border bg-white/65 px-4 outline-none"
            disabled={isPending}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label className="block">
          <span className="text-forest text-sm font-medium">비밀번호</span>
          <input
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            className="border-forest/15 text-forest placeholder:text-sub/50 focus:border-canopy mt-2 min-h-12 w-full rounded-2xl border bg-white/65 px-4 outline-none"
            disabled={isPending}
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="6자 이상 입력"
            required
            type="password"
            value={password}
          />
        </label>

        {mode === "signin" && (
          <button
            className="text-sub hover:text-canopy ml-auto block text-xs underline-offset-4 hover:underline disabled:cursor-wait disabled:opacity-60"
            disabled={isPending}
            onClick={handlePasswordReset}
            type="button"
          >
            비밀번호를 잊으셨나요?
          </button>
        )}

        <button
          className="button-primary w-full gap-2 disabled:cursor-wait disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {pendingAction === "email" && (
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
          )}
          {mode === "signin" ? "이메일로 로그인" : "이메일로 회원가입"}
        </button>
      </form>

      <p className="text-sub mt-6 text-center text-sm">
        {mode === "signin" ? "처음 오셨나요?" : "이미 계정이 있나요?"}{" "}
        <button
          className="text-canopy font-semibold underline-offset-4 hover:underline disabled:opacity-60"
          disabled={isPending}
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          type="button"
        >
          {mode === "signin" ? "회원가입" : "로그인"}
        </button>
      </p>
    </div>
  );
}
