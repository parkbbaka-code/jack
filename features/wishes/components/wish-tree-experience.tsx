"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { WishView } from "@/types/models";

import styles from "./wish-tree-experience.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export function WishTreeExperience({
  initialWishes,
  currentUserId,
}: {
  initialWishes: WishView[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [wishes, setWishes] = useState(initialWishes);
  const [selected, setSelected] = useState<WishView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function openWish(wish: WishView) {
    if (!wish.isPublic && wish.ownerId !== currentUserId) {
      setNotice("이 소원은 열리지 않아요");
      return;
    }
    setSelected(wish);
  }

  async function updatePrivacy(next: Pick<WishView, "isPublic" | "anonymous">) {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/wishes/${selected.wishId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error("privacy-update-failed");
      const privacy = (await response.json()) as Pick<
        WishView,
        "isPublic" | "anonymous" | "displayName"
      >;
      const updated = { ...selected, ...privacy };
      setSelected(updated);
      setWishes((current) =>
        current.map((wish) =>
          wish.wishId === updated.wishId ? updated : wish,
        ),
      );
    } catch {
      setNotice("설정을 바꾸지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function report() {
    if (!selected || busy) return;
    if (!currentUserId) {
      router.push("/login?next=/wishtree");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/wishes/${selected.wishId}/report`, {
        method: "POST",
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        hidden?: boolean;
      };
      if (response.status === 409) {
        setNotice("이미 신고한 소원이에요");
        return;
      }
      if (!response.ok) throw new Error("report-failed");
      setNotice("신고가 접수됐어요");
      if (result.hidden) {
        setWishes((current) =>
          current.filter((wish) => wish.wishId !== selected.wishId),
        );
      }
      setSelected(null);
    } catch {
      setNotice("신고를 접수하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function takeDown() {
    if (!selected || busy) return;
    if (!window.confirm("이 소원지를 나무에서 내릴까요? 기록은 보존됩니다.")) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/wishes/${selected.wishId}/takedown`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("takedown-failed");
      setWishes((current) =>
        current.filter((wish) => wish.wishId !== selected.wishId),
      );
      setSelected(null);
      setNotice("소원지를 내렸어요. 기록은 그대로 보존됩니다.");
    } catch {
      setNotice("소원지를 내리지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section
        className={`tree-scroll-panel tree-branch-panel ${styles.scene}`}
      >
        <div className="tree-panel-copy">
          <p className="wish-eyebrow">가지에 걸린 소원</p>
          <p className="mt-3 text-base text-[#E8EDF7]">
            소원지를 눌러 마음을 읽어보세요
          </p>
        </div>

        <div className={styles.objects} aria-label="가지에 걸린 최근 소원지">
          {wishes.map((wish, index) => (
            <button
              aria-label={wish.isPublic ? "소원지 열기" : "비공개 소원지"}
              className={`${styles.paper} ${!wish.isPublic ? styles.privatePaper : ""} ${wish.fulfilled ? styles.fulfilledPaper : ""}`}
              key={wish.wishId}
              onClick={() => openWish(wish)}
              style={{
                left: `${wish.slot.x}%`,
                top: `${wish.slot.y}%`,
                rotate: `${wish.slot.rot}deg`,
                animationDelay: `${(index % 7) * -0.55}s`,
              }}
              type="button"
            />
          ))}
        </div>

        {wishes.length === 0 ? (
          <p className="relative z-10 m-auto rounded-full bg-[#0C1810]/70 px-4 py-2 text-sm text-[#E8EDF7]">
            가장 먼저 소원을 걸어보세요
          </p>
        ) : null}

        <AnimatePresence>
          {notice ? (
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className={styles.notice}
              exit={{ opacity: 0, y: 6 }}
              initial={{ opacity: 0, y: 6 }}
            >
              {notice}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {selected ? (
          <motion.div
            animate={{ opacity: 1 }}
            aria-label="소원 상세"
            aria-modal="true"
            className={styles.backdrop}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelected(null);
            }}
            role="dialog"
          >
            <motion.article
              animate={{ y: 0, x: 0 }}
              className={styles.sheet}
              exit={{ y: 32 }}
              initial={{ y: 32 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className={styles.handle} />
              <div className={styles.meta}>
                <span className={styles.avatar} aria-hidden>
                  {(selected.displayName ?? "익").slice(0, 1)}
                </span>
                <div>
                  <p className="font-medium">
                    {selected.anonymous ? "익명" : selected.displayName}
                  </p>
                  <p className="mt-1 text-xs text-[#5E6B5A]">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
                <button
                  aria-label="닫기"
                  className={styles.close}
                  onClick={() => setSelected(null)}
                  type="button"
                >
                  ×
                </button>
              </div>

              <p className={styles.wishText}>{selected.text}</p>

              {selected.ownerId === currentUserId ? (
                <div className={styles.ownerPanel}>
                  <label className={styles.toggleRow}>
                    <span>소원 공개</span>
                    <input
                      checked={selected.isPublic}
                      className={styles.toggle}
                      disabled={busy}
                      onChange={(event) =>
                        updatePrivacy({
                          isPublic: event.target.checked,
                          anonymous: selected.anonymous,
                        })
                      }
                      type="checkbox"
                    />
                  </label>
                  <label className={styles.toggleRow}>
                    <span>익명으로 표시</span>
                    <input
                      checked={selected.anonymous}
                      className={styles.toggle}
                      disabled={busy}
                      onChange={(event) =>
                        updatePrivacy({
                          isPublic: selected.isPublic,
                          anonymous: event.target.checked,
                        })
                      }
                      type="checkbox"
                    />
                  </label>
                </div>
              ) : null}

              <footer className={styles.footer}>
                <span>일반 소원지 · {formatDate(selected.createdAt)}</span>
                {selected.ownerId === currentUserId ? (
                  <button
                    className={styles.textAction}
                    disabled={busy}
                    onClick={takeDown}
                    type="button"
                  >
                    내리기
                  </button>
                ) : (
                  <button
                    className={styles.textAction}
                    disabled={busy}
                    onClick={report}
                    type="button"
                  >
                    신고
                  </button>
                )}
              </footer>
            </motion.article>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
