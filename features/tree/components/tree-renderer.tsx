import { calculateGrowth } from "@/features/tree/lib/growth";
import type { Season, TreeStatus } from "@/types/models";

interface TreeRendererProps {
  seed: number;
  season: Season;
  waterCount: number;
  cheerCount: number;
  status: TreeStatus;
}

const palettes: Record<
  Season,
  { leaf: string[]; ground: string; sky: string }
> = {
  spring: {
    leaf: ["#78a86c", "#9abb72", "#d9a7ae"],
    ground: "#d6c9a8",
    sky: "#f4e8df",
  },
  summer: {
    leaf: ["#2c5a3c", "#477a4e", "#6e985c"],
    ground: "#b9aa7d",
    sky: "#e5eee0",
  },
  autumn: {
    leaf: ["#b96635", "#d08a3d", "#c6a24e"],
    ground: "#b99a6e",
    sky: "#f2e5d4",
  },
  winter: {
    leaf: ["#6e8575", "#91a293", "#d9ded8"],
    ground: "#c8c7bd",
    sky: "#e8ece8",
  },
};

function mulberry32(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

const stageNames = {
  seed: "씨앗",
  sprout: "새싹",
  sapling: "어린 묘목",
  "young-tree": "어린 나무",
  "mature-tree": "성숙한 나무",
  "ready-to-bloom": "꽃필 준비가 된 나무",
} as const;

export function TreeRenderer({
  seed,
  season,
  waterCount,
  cheerCount,
  status,
}: TreeRendererProps) {
  const growth = calculateGrowth(waterCount);
  const isBloomed = status === "bloomed" || status === "archived";
  const palette = palettes[season];
  const random = mulberry32(seed);
  const trunkHeight = 45 + growth.stageValue * 180;
  const trunkTop = 290 - trunkHeight;
  const branchCount =
    growth.stage === "seed" ? 0 : 2 + Math.floor(growth.stageValue * 8);
  const leafCount =
    growth.stage === "seed" ? 0 : 4 + Math.floor(growth.stageValue * 32);
  const branches = Array.from({ length: branchCount }, (_, index) => {
    const progress = (index + 1) / (branchCount + 1);
    const y = 280 - trunkHeight * (0.24 + progress * 0.68);
    const direction = index % 2 === 0 ? -1 : 1;
    const length = 26 + random() * (26 + growth.stageValue * 24);

    return {
      x2: 160 + direction * length,
      y1: y,
      y2: y - 18 - random() * 24,
      width: Math.max(2, 4 + growth.stageValue * 5 - progress * 2),
    };
  });
  const crownRadius = 34 + growth.stageValue * 78;
  const leaves = Array.from({ length: leafCount }, (_, index) => {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * crownRadius;

    return {
      cx: 160 + Math.cos(angle) * radius,
      cy: trunkTop + 18 + Math.sin(angle) * radius * 0.62,
      rx: 7 + random() * 8,
      ry: 4 + random() * 6,
      rotation: random() * 180,
      color: palette.leaf[index % palette.leaf.length],
      delay: `${(random() * 2.4).toFixed(2)}s`,
    };
  });
  const fireflies = Array.from({ length: Math.min(12, cheerCount) }, () => ({
    cx: 65 + random() * 190,
    cy: 70 + random() * 190,
    delay: `${(random() * 3).toFixed(2)}s`,
  }));
  const flowers = Array.from({ length: isBloomed ? 18 : 0 }, (_, index) => ({
    cx: 160 + Math.cos(random() * Math.PI * 2) * random() * crownRadius,
    cy:
      trunkTop +
      18 +
      Math.sin(random() * Math.PI * 2) * random() * crownRadius * 0.58,
    color:
      index % 3 === 0 ? "#f0c7cf" : index % 3 === 1 ? "#fff5e2" : "#d8b4c2",
    rotation: random() * 60,
  }));

  return (
    <figure className="flex w-full flex-col items-center">
      <svg
        aria-label={`${isBloomed ? "꽃이 핀 나무" : stageNames[growth.stage]}, 성장 ${Math.round(growth.stageValue * 100)}퍼센트`}
        className="h-auto w-full max-w-sm"
        role="img"
        viewBox="0 0 320 360"
      >
        <defs>
          <linearGradient id={`sky-${seed}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={palette.sky} stopOpacity="0.2" />
            <stop offset="1" stopColor={palette.sky} stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id={`trunk-${seed}`} x1="0" x2="1">
            <stop offset="0" stopColor="#76583d" />
            <stop offset="0.55" stopColor="#9a7650" />
            <stop offset="1" stopColor="#65462f" />
          </linearGradient>
        </defs>

        <ellipse
          cx="160"
          cy="190"
          fill={`url(#sky-${seed})`}
          rx="145"
          ry="155"
        />
        <ellipse
          cx="160"
          cy="304"
          fill={palette.ground}
          opacity="0.34"
          rx="118"
          ry="18"
        />

        {growth.stage === "seed" ? (
          <g className="tree-breathe">
            <path
              d="M145 285 C149 267 171 267 176 285 C171 295 151 296 145 285Z"
              fill="#76583d"
            />
            <path
              d="M160 277 C157 265 161 257 169 251"
              fill="none"
              opacity="0.7"
              stroke="#477a4e"
              strokeLinecap="round"
              strokeWidth="3"
            />
          </g>
        ) : (
          <g>
            {branches.map((branch, index) => (
              <line
                key={`branch-${index}`}
                stroke={`url(#trunk-${seed})`}
                strokeLinecap="round"
                strokeWidth={branch.width}
                x1="160"
                x2={branch.x2}
                y1={branch.y1}
                y2={branch.y2}
              />
            ))}
            <path
              d={`M${151 - growth.stageValue * 8} 292 C${153 - growth.stageValue * 3} 245 ${155 - growth.stageValue * 6} ${trunkTop + 45} 160 ${trunkTop} C${166 + growth.stageValue * 4} ${trunkTop + 48} ${170 + growth.stageValue * 6} 246 ${169 + growth.stageValue * 9} 292Z`}
              fill={`url(#trunk-${seed})`}
            />
            {leaves.map((leaf, index) => (
              <ellipse
                key={`leaf-${index}`}
                className="tree-leaf"
                cx={leaf.cx}
                cy={leaf.cy}
                fill={leaf.color}
                opacity={season === "winter" ? 0.66 : 0.88}
                rx={leaf.rx}
                ry={leaf.ry}
                style={{ animationDelay: leaf.delay }}
                transform={`rotate(${leaf.rotation} ${leaf.cx} ${leaf.cy})`}
              />
            ))}
            {flowers.map((flower, index) => (
              <g
                key={`flower-${index}`}
                className="tree-flower"
                transform={`translate(${flower.cx} ${flower.cy}) rotate(${flower.rotation})`}
              >
                {[0, 72, 144, 216, 288].map((angle) => (
                  <ellipse
                    key={angle}
                    cx="0"
                    cy="-5"
                    fill={flower.color}
                    rx="3.2"
                    ry="5.5"
                    transform={`rotate(${angle})`}
                  />
                ))}
                <circle cx="0" cy="0" fill="#d4a94c" r="2.2" />
              </g>
            ))}
          </g>
        )}

        {fireflies.map((firefly, index) => (
          <circle
            key={`firefly-${index}`}
            className="tree-firefly"
            cx={firefly.cx}
            cy={firefly.cy}
            fill="#e6c968"
            r="2.4"
            style={{ animationDelay: firefly.delay }}
          />
        ))}
      </svg>
      <figcaption className="text-center">
        <p className="text-canopy text-xs tracking-[0.22em]">
          {isBloomed ? "BLOOMED" : growth.stage.toUpperCase()}
        </p>
        <p className="text-forest mt-2 font-serif text-2xl">
          {isBloomed ? "꽃이 핀 나무" : stageNames[growth.stage]}
        </p>
        <p className="text-sub mt-2 text-sm">
          성장 {Math.round(growth.stageValue * 100)}% · 물 {growth.waterCount}회
        </p>
      </figcaption>
    </figure>
  );
}
