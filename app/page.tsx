import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 py-16">
      <div className="forest-halo" aria-hidden="true" />
      <section className="relative z-10 mx-auto max-w-xl text-center">
        <p className="text-canopy mb-5 text-sm tracking-[0.32em]">IROORI</p>
        <h1 className="text-forest font-serif text-5xl leading-tight sm:text-7xl">
          천천히,
          <br />
          이루리.
        </h1>
        <p className="text-sub mx-auto mt-7 max-w-md text-base leading-8 sm:text-lg">
          시간은 계절을 바꾸고, 당신의 기록은 나무를 키웁니다.
          <br />
          멈춰 있어도 나무는 조용히 기다립니다.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="button-primary" href="/login">
            첫 씨앗 심기
          </Link>
          <Link className="button-secondary" href="/forest">
            모두의 숲 둘러보기
          </Link>
        </div>
      </section>
    </main>
  );
}
