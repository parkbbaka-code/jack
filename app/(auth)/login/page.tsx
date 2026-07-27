import Link from "next/link";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 py-12">
      <div aria-hidden className="forest-halo" />
      <section className="border-forest/10 relative w-full max-w-sm rounded-[2rem] border bg-white/55 p-8 shadow-sm backdrop-blur-md">
        <Link className="text-canopy text-xs tracking-[0.28em]" href="/">
          IROORI
        </Link>
        <h1 className="text-forest mt-8 font-serif text-3xl">
          다시, 나의 숲으로
        </h1>
        <p className="text-sub mt-3 leading-7">
          오늘의 마음을 기록하고, 나만의 나무를 천천히 키워보세요.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
