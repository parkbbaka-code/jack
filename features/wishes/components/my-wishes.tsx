"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PREVIEW_LEN } from "@/constants/wishes";
import type { MyWishView } from "@/types/models";

import styles from "./my-wishes.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function preview(text: string) {
  const characters = Array.from(text);
  return characters.length > PREVIEW_LEN
    ? `${characters.slice(0, PREVIEW_LEN).join("")}…`
    : text;
}

function isFaded(wish: MyWishView) {
  return (
    wish.takenDownAt !== null ||
    wish.hidden ||
    new Date(wish.expiresAt).getTime() <= Date.now()
  );
}

function canEdit(wish: MyWishView) {
  return (
    !isFaded(wish) &&
    wish.editCount < 3 &&
    new Date(wish.editableUntil).getTime() > Date.now()
  );
}

export function MyWishes({ initialWishes }: { initialWishes: MyWishView[] }) {
  const [wishes, setWishes] = useState(initialWishes);
  const [selected, setSelected] = useState<MyWishView | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmingTakeDown, setConfirmingTakeDown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const groups = useMemo(
    () => ({
      fulfilled: wishes.filter((wish) => wish.fulfilled && !isFaded(wish)),
      active: wishes.filter((wish) => !wish.fulfilled && !isFaded(wish)),
      faded: wishes.filter(isFaded),
    }),
    [wishes],
  );

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function updateLocal(updated: MyWishView) {
    setSelected(updated);
    setWishes((current) =>
      current.map((wish) => (wish.wishId === updated.wishId ? updated : wish)),
    );
  }

  function openWish(wish: MyWishView) {
    setSelected(wish);
    setDraft(wish.text);
    setEditing(false);
    setConfirmingTakeDown(false);
  }

  async function toggleFulfilled(wish: MyWishView) {
    if (busy || isFaded(wish)) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/wishes/${wish.wishId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfilled: !wish.fulfilled }),
      });
      if (!response.ok) throw new Error("fulfilled-update-failed");
      const updated = { ...wish, fulfilled: !wish.fulfilled };
      setWishes((current) =>
        current.map((item) => (item.wishId === wish.wishId ? updated : item)),
      );
      if (selected?.wishId === wish.wishId) setSelected(updated);
      setNotice(
        updated.fulfilled
          ? "이루어진 소원이 우듬지로 올라갔어요"
          : "소원지를 다시 가지에 걸었어요",
      );
    } catch {
      setNotice("상태를 바꾸지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/wishes/${selected.wishId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        text?: string;
        editCount?: number;
      };
      if (!response.ok || !result.text || result.editCount === undefined) {
        throw new Error("edit-failed");
      }
      updateLocal({
        ...selected,
        text: result.text,
        editCount: result.editCount,
      });
      setEditing(false);
      setNotice("소원을 고쳤어요");
    } catch {
      setEditing(false);
      setNotice("지금은 소원을 고칠 수 없어요");
    } finally {
      setBusy(false);
    }
  }

  async function takeDown() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/wishes/${selected.wishId}/takedown`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("takedown-failed");
      const updated = { ...selected, takenDownAt: new Date().toISOString() };
      setWishes((current) =>
        current.map((wish) =>
          wish.wishId === updated.wishId ? updated : wish,
        ),
      );
      setSelected(null);
      setConfirmingTakeDown(false);
      setNotice("소원지를 내렸어요. 기록은 그대로 보존됩니다.");
    } catch {
      setNotice("소원지를 내리지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }

  const sections = [
    { key: "fulfilled", title: "이루어진 소원", items: groups.fulfilled },
    { key: "active", title: "걸려 있는 소원", items: groups.active },
    { key: "faded", title: "바랜 소원", items: groups.faded },
  ] as const;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className="wish-eyebrow">이루리</p>
            <h1 className="mt-2 font-serif text-3xl">내 소원</h1>
          </div>
          <nav className={styles.headerLinks}>
            <Link href="/wishtree">소원나무</Link>
            <Link href="/settings">설정</Link>
          </nav>
        </header>

        {wishes.length === 0 ? (
          <div className={styles.empty}>
            <p>아직 걸어둔 소원이 없어요.</p>
            <Link className="wish-ghost-button mt-5" href="/wishtree">
              소원나무로 가기
            </Link>
          </div>
        ) : (
          sections.map(({ key, title, items }) =>
            items.length > 0 ? (
              <section className={styles.section} key={key}>
                <h2 className={styles.sectionTitle}>{title}</h2>
                <div className={styles.list}>
                  {items.map((wish) => (
                    <article
                      className={`${styles.card} ${wish.fulfilled && !isFaded(wish) ? styles.fulfilledCard : ""} ${isFaded(wish) ? styles.fadedCard : ""}`}
                      key={wish.wishId}
                    >
                      <span className={styles.thumbnail} aria-hidden />
                      <div className={styles.cardBody}>
                        <button
                          className={styles.openButton}
                          onClick={() => openWish(wish)}
                          type="button"
                        >
                          <p className={styles.preview}>{preview(wish.text)}</p>
                          <p className={styles.cardMeta}>
                            일반 소원지 · {formatDate(wish.createdAt)}
                          </p>
                        </button>
                        {!isFaded(wish) ? (
                          <div className={styles.actions}>
                            <button
                              className={styles.actionButton}
                              disabled={busy}
                              onClick={() => toggleFulfilled(wish)}
                              type="button"
                            >
                              {wish.fulfilled
                                ? "다시 소원으로"
                                : "이루어졌어요"}
                            </button>
                            <Link
                              className={styles.actionLink}
                              href={`/wishtree?wish=${encodeURIComponent(wish.wishId)}&x=${wish.slot.x}&y=${wish.slot.y}&fulfilled=${wish.fulfilled ? "1" : "0"}`}
                            >
                              나무에서 보기
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null,
          )
        )}
      </div>

      <AnimatePresence>
        {selected ? (
          <motion.div
            animate={{ opacity: 1 }}
            aria-label="내 소원 상세"
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
              animate={{ y: 0 }}
              className={styles.sheet}
              exit={{ y: 32 }}
              initial={{ y: 32 }}
            >
              <div className={styles.handle} />
              <header className={styles.sheetHeader}>
                <div>
                  <p className="font-medium">일반 소원지</p>
                  <p className="mt-1 text-xs text-[#5E6B5A]">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
                <button
                  aria-label="닫기"
                  className="text-2xl text-[#5E6B5A]"
                  onClick={() => setSelected(null)}
                  type="button"
                >
                  ×
                </button>
              </header>

              {editing ? (
                <div className="my-7">
                  <textarea
                    className={styles.editor}
                    maxLength={60}
                    onChange={(event) => setDraft(event.target.value)}
                    value={draft}
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-[#5E6B5A]">
                    <span>{Array.from(draft).length} / 60</span>
                    <div className="flex gap-3">
                      <button onClick={() => setEditing(false)} type="button">
                        취소
                      </button>
                      <button
                        className="font-medium text-[#1C3A28]"
                        disabled={busy || Array.from(draft.trim()).length < 2}
                        onClick={saveEdit}
                        type="button"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className={styles.wishText}>{selected.text}</p>
              )}

              {!isFaded(selected) ? (
                <div className={styles.sheetActions}>
                  <button
                    className={styles.sheetAction}
                    disabled={busy}
                    onClick={() => toggleFulfilled(selected)}
                    type="button"
                  >
                    {selected.fulfilled ? "다시 소원으로" : "이루어졌어요"}
                  </button>
                  {canEdit(selected) && !editing ? (
                    <button
                      className={styles.sheetAction}
                      onClick={() => setEditing(true)}
                      type="button"
                    >
                      고치기
                    </button>
                  ) : null}
                  <Link
                    className={styles.sheetAction}
                    href={`/wishtree?wish=${encodeURIComponent(selected.wishId)}&x=${selected.slot.x}&y=${selected.slot.y}&fulfilled=${selected.fulfilled ? "1" : "0"}`}
                  >
                    나무에서 보기
                  </Link>
                  <button
                    className={`${styles.sheetAction} ml-auto`}
                    onClick={() => setConfirmingTakeDown(true)}
                    type="button"
                  >
                    내리기
                  </button>
                </div>
              ) : null}

              {confirmingTakeDown ? (
                <div className={styles.confirmBox}>
                  <p className="font-medium">이 소원을 내릴까요?</p>
                  <p className="mt-1 text-xs text-[#5E6B5A]">
                    나무에서 보이지 않게 됩니다. 내린 소원지는 다시 걸 수
                    없어요.
                  </p>
                  <div className="mt-4 flex justify-end gap-4 text-sm text-[#5E6B5A]">
                    <button
                      onClick={() => setConfirmingTakeDown(false)}
                      type="button"
                    >
                      그대로 두기
                    </button>
                    <button disabled={busy} onClick={takeDown} type="button">
                      내리기
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.article>
          </motion.div>
        ) : null}
      </AnimatePresence>

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
    </main>
  );
}
