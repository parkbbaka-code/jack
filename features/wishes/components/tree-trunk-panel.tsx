"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import Link from "next/link";
import { useRef } from "react";

import styles from "./wish-tree-experience.module.css";

export function TreeTrunkPanel() {
  const panelRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: panelRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [22, -22]);

  return (
    <section className="tree-scroll-panel tree-trunk-panel" ref={panelRef}>
      <motion.div
        aria-hidden="true"
        className={`${styles.parallaxLayer} ${styles.trunkLayer}`}
        style={{ y: reduceMotion ? 0 : y }}
      />
      <div className="tree-panel-copy self-end">
        <p className="wish-eyebrow">나무의 밑동</p>
        <p className="mt-3 max-w-56 text-sm leading-6 text-[#E8EDF7]">
          잎 사이 별빛이 비추는 밤, 소원은 이곳에 오래 머뭅니다.
        </p>
      </div>
      <div className="relative z-10 flex items-end justify-end">
        <Link className="wish-gold-button shrink-0" href="/wish/new">
          소원 걸기
        </Link>
      </div>
    </section>
  );
}
