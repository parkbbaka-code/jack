import Link from "next/link";

import {
  getWishTreeStats,
  listRecentWishes,
} from "@/lib/firebase/firestore-rest";

import styles from "./home.module.css";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default async function Home() {
  const [wishes, stats] = await Promise.all([
    listRecentWishes(null).catch(() => []),
    getWishTreeStats().catch(() => ({
      totalHung: 0,
      totalFulfilled: 0,
      pileCount: 0,
    })),
  ]);
  const publicWishes = wishes.filter((wish) => wish.isPublic).slice(0, 3);
  const totalHung = Math.max(stats.totalHung, wishes.length);
  const totalFulfilled = Math.max(
    stats.totalFulfilled,
    wishes.filter((wish) => wish.fulfilled).length,
  );

  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.wordmark}>이루리</p>
          <h1 className={styles.headline}>
            소원나무가
            <br />
            열렸습니다.
          </h1>
          <p className="mx-auto mt-7 max-w-md text-base leading-8 text-[#E8EDF7] sm:text-lg">
            당신의 소원을 기다리고 있습니다
          </p>
          <div className="mx-auto mt-10 flex max-w-sm flex-col gap-3">
            <Link className="wish-gold-button" href="/wish/new">
              소원 걸기
            </Link>
            <Link className="wish-ghost-button" href="/wishtree">
              소원나무 구경하기
            </Link>
          </div>
          <p className="mt-5 text-sm text-[#E8EDF7]/70">
            로그인 없이 둘러볼 수 있어요
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.contentShell}>
          <div className={styles.stats}>
            <div>
              <p className={styles.statNumber}>
                {totalHung.toLocaleString("ko-KR")}
              </p>
              <p className={styles.statLabel}>걸린 소원</p>
            </div>
            <div>
              <p className={styles.statNumber}>
                {totalFulfilled.toLocaleString("ko-KR")}
              </p>
              <p className={styles.statLabel}>이루어진 소원</p>
            </div>
          </div>

          {publicWishes.length > 0 ? (
            <div className={styles.papers} aria-label="소원나무의 최근 소원">
              {publicWishes.map((wish) => (
                <article className={styles.paper} key={wish.wishId}>
                  <p>{wish.text}</p>
                  <p className={styles.paperMeta}>
                    {wish.anonymous ? "익명" : wish.displayName} ·{" "}
                    {formatDate(wish.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          ) : null}

          <div className={styles.invitation}>
            <p className="wish-eyebrow">당신의 소원은 무엇인가요</p>
            <h2 className="mt-5 font-serif text-3xl leading-relaxed sm:text-5xl">
              마음에 머무는 한 문장을
              <br />
              나무에 걸어보세요.
            </h2>
            <Link className="wish-gold-button mt-8" href="/wish/new">
              소원 걸기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
