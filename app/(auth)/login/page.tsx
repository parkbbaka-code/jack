import Link from "next/link";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 py-12">
      <div aria-hidden className="forest-halo" />
      <section className="border-forest/10 relative w-full max-w-sm rounded-[2rem] border bg-white/55 p-8 shadow-sm backdrop-blur-md">
        <Link className="text-canopy text-xs tracking-[0.28em]" href="/">
          이루리
        </Link>
        <h1 className="text-forest mt-8 font-serif text-3xl">
          소원을 걸러 왔나요?
        </h1>
        <p className="text-sub mt-3 leading-7">
          로그인하고 밤의 소원나무에 마음을 남겨보세요.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
