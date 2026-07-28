"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useSearchParams } from "next/navigation";

import styles from "./hung-wish-arrival.module.css";

type Target = { x: number; y: number };

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function HungWishArrival() {
  const reduceMotion = useReducedMotion();
  const search = useSearchParams();
  const [landed, setLanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const target = useMemo<Target | null>(() => {
    if (search.get("hung") !== "1") return null;
    const x = Number(search.get("x"));
    const y = Number(search.get("y"));

    return {
      x: Number.isFinite(x) ? clamp(x, 18, 82) : 54,
      y: Number.isFinite(y) ? clamp(y, 22, 56) : 36,
    };
  }, [search]);

  function finishArrival() {
    setLanded(true);
    window.history.replaceState({}, "", "/wishtree");
    window.setTimeout(() => setDismissed(true), reduceMotion ? 350 : 850);
  }

  return (
    <AnimatePresence>
      {target && !dismissed && (
        <motion.div
          animate={{ opacity: 1 }}
          aria-live="polite"
          className={styles.overlay}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.32 }}
        >
          <div className={styles.veil} />
          <motion.div
            animate={{
              left: `${target.x}%`,
              opacity: 1,
              rotate: reduceMotion ? target.x % 2 : [0, -7, 5, -3],
              scale: reduceMotion ? 0.62 : [1.08, 0.9, 0.72, 0.62],
              top: `${target.y}%`,
            }}
            className={styles.paper}
            initial={{
              left: "50%",
              opacity: 0,
              rotate: -2,
              scale: 1.08,
              top: "88%",
            }}
            onAnimationComplete={finishArrival}
            transition={{
              duration: reduceMotion ? 0.35 : 2.15,
              ease: [0.22, 0.8, 0.3, 1],
              times: reduceMotion ? undefined : [0, 0.32, 0.7, 1],
            }}
          />
          {landed && (
            <motion.span
              animate={{ opacity: 0, scale: 2.8 }}
              className={styles.glow}
              initial={{
                left: `${target.x}%`,
                opacity: 1,
                scale: 0.4,
                top: `${target.y}%`,
              }}
              transition={{ duration: reduceMotion ? 0.25 : 0.8 }}
            />
          )}
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className={styles.message}
            initial={{ opacity: 0, y: 8 }}
            transition={{ delay: reduceMotion ? 0 : 1.25, duration: 0.45 }}
          >
            소원이 나무에 조용히 걸렸어요
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
