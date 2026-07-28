"use client";

import { useEffect, useRef } from "react";
import { LoaderCircle } from "lucide-react";

type HandoffResponse = {
  customToken: string;
  nextPath: string;
};

export function KakaoLoginComplete() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function completeLogin() {
      try {
        const handoffResponse = await fetch("/api/auth/kakao/token", {
          method: "POST",
        });

        if (!handoffResponse.ok) throw new Error("kakao-handoff-failed");

        const handoff = (await handoffResponse.json()) as HandoffResponse;
        const [{ getFirebaseClientServices }, firebaseAuth] = await Promise.all([
          import("@/lib/firebase/client"),
          import("firebase/auth"),
        ]);
        const credential = await firebaseAuth.signInWithCustomToken(
          getFirebaseClientServices().auth,
          handoff.customToken,
        );
        const tokenResult = await credential.user.getIdTokenResult();
        const displayName =
          typeof tokenResult.claims.displayName === "string"
            ? tokenResult.claims.displayName
            : undefined;

        if (displayName && credential.user.displayName !== displayName) {
          await firebaseAuth.updateProfile(credential.user, { displayName });
        }

        const idToken = await credential.user.getIdToken();
        const sessionResponse = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        if (!sessionResponse.ok) throw new Error("session-exchange-failed");

        window.location.replace(handoff.nextPath);
      } catch {
        window.location.replace("/login?error=kakao_failed");
      }
    }

    void completeLogin();
  }, []);

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 py-12">
      <div aria-hidden className="forest-halo" />
      <section className="border-forest/10 relative w-full max-w-sm rounded-[2rem] border bg-white/55 p-8 text-center shadow-sm backdrop-blur-md">
        <LoaderCircle
          aria-hidden
          className="text-canopy mx-auto size-7 animate-spin"
        />
        <h1 className="text-forest mt-5 font-serif text-2xl">
          카카오 로그인을 마무리하고 있어요
        </h1>
        <p className="text-sub mt-3 text-sm">잠시만 기다려주세요.</p>
      </section>
    </main>
  );
}
