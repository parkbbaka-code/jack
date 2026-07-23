export default function AppHomePage() {
  return (
    <main className="mx-auto min-h-svh max-w-2xl px-6 py-10">
      <p className="text-canopy text-sm">오늘의 나무</p>
      <h1 className="text-forest mt-2 font-serif text-4xl">
        나무가 기다리고 있어요.
      </h1>
      <p className="text-sub mt-4 leading-7">
        Firebase 연결 후 활성 나무와 오늘의 기록이 이곳에 표시됩니다.
      </p>
    </main>
  );
}
