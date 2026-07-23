import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-12">
      <section className="border-forest/10 w-full max-w-sm rounded-[2rem] border bg-white/45 p-8 shadow-sm backdrop-blur">
        <Link className="text-canopy text-xs tracking-[0.28em]" href="/">
          IROORI
        </Link>
        <h1 className="text-forest mt-8 font-serif text-3xl">
          다시, 나의 숲으로
        </h1>
        <p className="text-sub mt-3 leading-7">
          Firebase 프로젝트 연결 후 Google과 이메일 로그인이 활성화됩니다.
        </p>
        <div className="mt-8 space-y-3">
          <button className="button-primary w-full" disabled type="button">
            Google로 계속하기
          </button>
          <button className="button-secondary w-full" disabled type="button">
            이메일로 계속하기
          </button>
        </div>
      </section>
    </main>
  );
}
