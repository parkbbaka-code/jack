"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./settings-panel.module.css";

export function SettingsPanel({
  displayName,
  photoURL,
  provider,
}: {
  displayName: string;
  photoURL: string | null;
  provider: "카카오" | "구글";
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleNotifications(checked: boolean) {
    setNotifications(checked);
  }

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("logout-failed");
      router.replace("/login");
      router.refresh();
    } catch {
      setError("로그아웃하지 못했어요. 잠시 후 다시 시도해주세요.");
      setBusy(false);
    }
  }

  async function deleteAccount() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) throw new Error("account-delete-failed");
      router.replace("/?account=deleted");
      router.refresh();
    } catch {
      setError("회원탈퇴를 처리하지 못했어요. 잠시 후 다시 시도해주세요.");
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className="wish-eyebrow">이루리</p>
            <h1 className="mt-2 font-serif text-3xl">설정</h1>
          </div>
          <Link href="/mywishes">내 소원</Link>
        </header>

        <div className={styles.panels}>
          <section className={styles.panel} aria-label="계정 정보">
            <div className={styles.row}>
              <div className={styles.profile}>
                <span className={styles.avatar}>
                  {photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" src={photoURL} />
                  ) : (
                    displayName.slice(0, 1)
                  )}
                </span>
                <div>
                  <p className="font-medium">{displayName}</p>
                  <p className={styles.sub}>{provider} 계정</p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.panel} aria-label="환경 설정">
            <label className={styles.row}>
              <span>알림</span>
              <input
                checked={notifications}
                className={styles.toggle}
                onChange={(event) => toggleNotifications(event.target.checked)}
                type="checkbox"
              />
            </label>
            <div className={styles.row}>
              <span>테마</span>
              <span className={styles.sub}>밤</span>
            </div>
          </section>

          <section className={styles.panel} aria-label="계정 관리">
            <div className={styles.row}>
              <button
                className={styles.button}
                disabled={busy}
                onClick={logout}
                type="button"
              >
                로그아웃
              </button>
            </div>
            <div className={styles.row}>
              <button
                className={`${styles.button} ${styles.deleteButton}`}
                disabled={busy}
                onClick={() => setConfirmingDelete(true)}
                type="button"
              >
                회원탈퇴
              </button>
            </div>
            {confirmingDelete ? (
              <div className={styles.confirm}>
                <p className="font-medium">정말 탈퇴할까요?</p>
                <p className={styles.sub}>
                  계정 정보는 삭제되고, 걸어둔 소원은 작성자 정보가 없는 익명
                  상태로 남습니다.
                </p>
                <div className={styles.confirmActions}>
                  <button
                    disabled={busy}
                    onClick={() => setConfirmingDelete(false)}
                    type="button"
                  >
                    그대로 이용하기
                  </button>
                  <button
                    className={styles.confirmDelete}
                    disabled={busy}
                    onClick={deleteAccount}
                    type="button"
                  >
                    탈퇴하기
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    </main>
  );
}
