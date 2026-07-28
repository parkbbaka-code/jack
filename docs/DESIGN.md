# Handoff: IROORI (이루리) — 소원나무 Phase 1

## Overview
IROORI is a mobile-first web app: a night forest scene with one giant wishing tree. Users buy an "offering" (paper slip, ribbon, lantern, stone…), write a wish, and watch it hang on the tree. This package covers Phase 1: landing, the wishtree view (`/wishtree`), the 3-step wish-writing flow, my wishes (`/mywishes`), login, and settings.

## About the Design Files
The files in this bundle are **HTML design references** built in a prototyping tool (Design Components / `.dc.html`), not production code. They render live in a browser via a small runtime (`support.js`, template `{{ }}` bindings, custom `<sc-for>`/`<sc-if>`/`<dc-import>` tags) that does **not** exist in a normal web/app codebase. **Do not copy this markup into the target codebase as-is.** The task is to recreate these screens pixel-faithfully in the project's actual stack (React/Vue/Next/SwiftUI/native/etc. — whichever the codebase already uses, or the best fit if none exists yet), using that codebase's existing component and state patterns.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and layout are final for Phase 1. Treat pixel values and hex codes below as the source of truth. A few pieces are explicitly *not* finished pixel art and are called out below (offering icons are provided as real PNG/WebP assets — use them directly).

## How to view the files
Open `IROORI 소원나무 v2.dc.html` in a browser after copying `support.js` alongside it (see Files section). It renders every screen as a scrollable gallery of device-frame mockups labeled by name (e.g. "우듬지" = canopy scroll state, "STEP 2 소원지" = write-step for paper offering). Use this as the visual reference while implementing.

---

## Design Tokens

### Colors
| Token | Hex | Usage |
|---|---|---|
| midnight | `#0B1A3A` | night sky, top of screen |
| indigo | `#1E3A6E` | mid sky |
| violet | `#4A3F7A` | leaf purple tint |
| teal | `#1F5E6B` | leaf teal tint |
| night | `#0C1810` | tree shadow / bottom of screen |
| bark | `#2E3A42` | trunk |
| forest | `#1C3A28` | card/sheet dark background |
| gold | `#C6A24E` (gradient `#E9D08A → #C6A24E → #A8853A`) | lanterns, fulfilled wishes, primary CTA |
| ember | `#B5462F` | red ribbon |
| ivory | `#F6F2E9` | wish paper, all readable text sheets |
| star | `#E8EDF7` | starlight/moon |
| sub | `#7C8B93` / `#9AA6AC` | secondary text on dark bg |
| ink (on ivory) | `#2E2A24` / `#2E3A42` | body text on ivory sheets |

Background is a vertical gradient `midnight → night` (see hero/wishtree containers: `radial-gradient`/`linear-gradient` from `#050C1C`/`#0A1410` down to near-black).

### Typography
- Headlines / wish text: **Noto Serif KR**, weight 500–600, 17–40px depending on role.
- UI text: **Pretendard**, weight 500+ only (never 400 — thin text disappears on dark background). Body 16px+, secondary 13–15px.
- Wish body text inside ivory sheets: Noto Serif KR 18–20px, line-height 1.8, color `#2E2A24`/`#2E3A42`.
- Counter text: Pretendard 12px, color `#9AA6AC`, bottom-right of the ivory input, never red/warning colored.

### Spacing / shape
- 8px base unit (8/16/24/32/48).
- Screen side margin 20–26px at 375px width.
- Touch targets ≥ 48×48px.
- Corner radius: cards/sheets 12–18px, buttons 12px, swatches circular.
- No drop shadows for mood — use **glow** (colored box-shadow / blur) instead, except for ivory sheets sitting on the dark scene which do use a soft dark shadow for lift.

### Components
- **Primary CTA**: gold gradient background, `#20170A` text, height 56px, radius 12px, slow pulsing glow (`animation: fabPulse 4.5s`).
- **Ghost button**: 1px border `sub` color, `ivory` text, transparent background.
- **Floating CTA**: gold pill, bottom-right, pulses like a lantern (3–5s cycle).
- **Toggle**: track `rgba(198,162,78,0.85)` (on) / muted (off), thumb `#F6F2E9` circle, 48×28px.
- **Ivory input/read sheet**: background `#F6F2E9`, radius 12px (or 24px top corners for bottom sheets), internal scroll, fixed non-scrolling counter footer.

---

## Screens

### 1. Landing (`/`)
- **Hero** (full-screen, 390×844 mobile frame): wishtree art background (blurred/darkened via gradient overlay), wordmark "이루리" letter-spaced at top, headline "여기, 소원을 걸고 가세요." (Noto Serif KR 35px/1.44), subhead "이루리 — 소원을 나무로 키우는 곳", two stacked CTAs (gold "소원 걸기" / ghost "소원나무 구경하기"), tiny caption "로그인 없이 둘러볼 수 있어요" in muted olive `#5E6B5A`.
- **Scroll section** (390×1080 frame): two big serif stat numbers (12,847 걸린 소원 / 1,203 이루어진 소원 in gold), 3 tilted ivory wish-paper cards showing real (anonymized) wishes at slight rotation with dark shadow, final centered CTA block "당신의 소원은 무엇인가요" + gold button.
- No feature lists, testimonials, badges, or logo walls — a quiet invitation, not a marketing page.

### 2. Wishtree (`/wishtree`) — most important screen
Single continuous vertical scene split into 3 zones by scroll position, same tree art, different vertical offset:
- **canopy** (top, offset_y≈40): gold "fulfilled" wishes near the top, wide starry sky, overlay pill "이 나무에서 1,203개의 소원이 이루어졌어요", caption "이루어진 소원은 우듬지에 모여 있어요".
- **branches** (default, offset_y≈330): live offerings hang here — white paper, cream fine-paper w/ gold trim, colored ribbon tags, glowing lanterns. Floating fireflies (small glowing dots drifting via `@keyframes drift`, 11–14s loops). Floating gold pill CTA "소원 걸기" bottom-right, pulsing.
- **trunk** (bottom, offset_y≈656): faded fallen papers, stone stack ("cairn"), wildflowers, dark gradient scrim at bottom, caption "바랜 소원은 사라지지 않아요 / 백일이 지난 소원지는 밑동에 낙엽처럼 쌓입니다. 돌은 그 자리에 그대로 남아요."
- **Wish detail** (tap a wish): bottom sheet, ivory background, rounded top corners (24px), drag handle, avatar circle + nickname/"익명" + date, full wish text (Noto Serif KR 20px/1.85), footer row: offering type + date on left, tiny "신고" (report) link on right. Max-height 70% of screen with internal scroll for long wishes.
- **Logged-out bottom bar**: fixed bar, "당신의 소원도 걸어보세요" + "로그인 없이 둘러볼 수 있어요" + ghost "시작하기" button.
- **Private wish**: shown as a plain back-of-paper silhouette (desaturated), not tappable; small pill caption "이 소원은 열리지 않아요" appears if tapped.
- **768px**: detail opens in a right-side panel (280–340px wide, ivory background) instead of a bottom sheet, listing recent wishes as small cards; tree art shifts left and scales up to fill remaining space.
- **1280px**: same right panel pattern, wider (340px), wordmark + top stat pill added to a header band.

**Absolute rules**: no badges, no lock icons, no countdown timers, no like/comment/follow/ranking UI, no confetti/celebration popups, no bottom tab bar.

### 3. Wish-writing flow (full-screen modal, 3 steps)
Background: blurred/darkened tree art behind a translucent gradient scrim throughout all 3 steps.

**STEP 1 — pick offering.** Close "×" top-left, 3-dot step indicator top-center (first dot gold, rest dim). Headline "무엇을 걸까요" + "이번 달 무료 소원지 1장이 있어요". Two sections:
- *매다는 헌물 · 전부 1년* (hanging offerings, all 1-year): horizontal-scroll row of 4 cards, 140×240px each, glass background (`rgba(20,38,28,0.44)`, blur), real asset icon centered, name (Noto Serif KR 17px), price, and character-limit copy phrased as a benefit ("60자까지 남길 수 있어요"), never as a restriction:
  - 소원지 (paper) — 무료 (free) / ₩1,000 extra — 60자
  - 고운 소원지 (fine paper) — ₩1,900 — 120자
  - 오색끈 (ribbon) — ₩2,900 — color choice (5 swatches shown on card) — 200자
  - 등불 (lantern) — ₩4,900 — 300자, "밤에 빛납니다"
- *새기는 헌물 · 기간 제한 없음* (engraved offering, no expiry): single wide card —
  - 돌 (stone) — ₩9,900 — 500자 + engraved name, "이름을 새기고 500자까지 남길 수 있어요"

Bottom: gold CTA "소원지 고르기" (56px, fixed 24px from bottom).
No lock icons, "premium"/"popular"/"limited" badges anywhere. Paid cards must not look bigger or flashier than the free one.

**STEP 2 — write the wish.** *Identical layout for all 5 offerings* — only the thumbnail, caption, sheet height, counter max, and one offering-specific extra field differ. **Rule: user text is never rendered on top of the object art — only inside the ivory sheet.** No vertical/rotated Korean text anywhere; everything is horizontal.
- Top: back "‹" (absolute, top-left, doesn't affect centering), object thumbnail centered (120px tall; 140px for the lantern, since it's a taller object), caption below it ("○○에 담깁니다"/"돌에 새깁니다").
- Ivory input sheet (`#F6F2E9`, radius 12px, drop shadow for lift): Noto Serif KR 18px/1.8 body text, internal scroll, non-scrolling counter pinned bottom-right (e.g. "21 / 60"). Sheet height scales with the char limit: ~140px (60자) → 190px (120/200자) → 230px (300자) → 250px (500자, plus a 46px single-line name field above it for stone's engraved name, 12-char limit, labelled "새길 이름 · 12자").
- Ribbon-only extra: "끈 색을 골라주세요" + 5 circular color swatches (36px) — 청 `#3B4FB0` / 백 `#F6F2E9` / 적 `#B5462F` (ember) / 흑 `#2A2E38` (dark navy substitute for pure black — pure black is invisible on the night background) / 황 `#C6A24E` (gold).
- Below that: glass panel (`rgba(20,38,28,0.5)`, blur) with exactly 2 toggles for every offering: "나무에 보이게 두기" (show on tree) / "이름 없이 걸기" (post anonymously).
- Bottom: gold CTA "다 적었어요" (56px, fixed near bottom).

**STEP 3 — hang it (the one "wow" moment).** Sequence, ≤2.5s total, no skip:
1. The ivory sheet folds toward center (text may blur/streak mid-motion — legibility only matters at rest).
2. Folded paper transforms into the chosen offering: 소원지 stays paper; 고운 소원지 gets a spreading gold-leaf trim; 오색끈 wraps a ribbon + attaches a wooden name-tag; 등불 — paper goes inside the lantern and it lights up; 돌 — paper hardens into stone and the engraving carves in.
3. Object flies up and attaches to a branch.
4. Quiet return to the wishtree screen.
End state: one small line of text only — "걸었어요." **No confetti, no "congratulations" modal, no share prompt.**

### 4. My wishes (`/mywishes`)
- List of wish cards; **thumbnail (56px) always on the left, text always on the right** — never overlaid.
- Sections top-to-bottom: 이루어진 소원 (fulfilled, gold-tinted card, tilted), 걸려 있는 소원 (active — each with an "이루어졌어요" ghost button), 바랜 소원 (faded, still shown, never says "만료됨"/expired).
- Preview text: 16 chars + `…`, offering type + date beneath.
- Tap → expands to full ivory detail sheet (18px/1.8).
- Items hung <30 min ago also show a "고치기" (edit) button — it simply disappears after 30 min, no countdown, no "edit period expired" message.
- Small "내리기" (take down) link at the bottom of the detail sheet.
- Extinguished lantern entries: quiet "다시 밝히기" (relight) text link — no red dot, no badge.
- Empty state: single line "아직 걸어둔 소원이 없어요." + ghost button "소원나무로 가기".

### 5. Login (`/login`)
- Minimal card floating over blurred tree art, glass background (`rgba(14,26,20,0.72)`, blur, radius 24px).
- Headline "소원을 걸려면 로그인이 필요해요" + "둘러보는 것은 그냥 하셔도 됩니다".
- Exactly 2 buttons: 카카오로 계속하기 (Kakao yellow `#FEE500`, dark text `#191600`) and 구글로 계속하기 (ivory `#F6F2E9`, dark text). No other auth methods.

### 6. Settings (`/settings`)
- Headline "설정". Three grouped glass panels (radius 16px, `rgba(20,38,28,0.42)` bg):
  1. Profile row: avatar circle, display name, auth method label.
  2. 알림 (notification) toggle — the only toggle — and 테마 (theme) row showing "밤" (night, non-interactive display for now).
  3. 로그아웃 (logout) and 회원탈퇴 (delete account, `#B37164` warm-red text, no aggressive red).
- Keep this screen minimal — do not add settings rows beyond what's shown.

---

## Interactions & Behavior
- **Edit window**: wish body text editable for 30 minutes after posting, max 3 edits. No countdown UI ever — the button simply stops appearing after 30 min elapses. Copy while active: "방금 걸었어요. 잠시 동안은 고칠 수 있어요."
- **Visibility & anonymity toggles**: always editable, no time limit (privacy fix must be immediate).
- **Take-down ("내리기") confirmation dialog**: "이 소원을 내릴까요? 나무에서 보이지 않게 됩니다." / small print "내린 소원지는 다시 걸 수 없어요." / buttons "내리기" and "그대로 두기" — styled in neutral `sub` gray, never warning red.
- **"이루어졌어요" (fulfilled)**: togglable any time; wish card transitions from its normal ivory/cream tone to a gold-tinted treatment (both before/after states shown in the mock).
- **Density scaling on the tree** (production behavior, not literally in the mock): realistic visible cap is ~100–150 wish objects at 375px width. Beyond that, represent growth as *density*, not raw count — background density texture (4 tiers: sparse/normal/dense/very dense), ~150 small non-tappable silhouettes at mid-distance, 20–40 sharp tappable wishes near camera, lanterns capped at 12 visible (glow stacks and blows out past that).
- **"Find my wish"**: logged-in users always get their own (up to 5) wishes rendered in the near/tappable layer regardless of density tier; lantern purchasers always see their own lit lantern; `/mywishes` → "나무에서 보기" pans/highlights the camera to that wish's spot on the tree.
- **Nothing is ever deleted or shown as deleted/expired.** Expired items fade and pile up at the trunk; copy never says "만료됨"/"소멸"/"만료".

## State Management (for the implementer)
Suggested state shape per wish object: `{ id, offeringType: 'paper'|'fine'|'ribbon'|'lantern'|'stone', ribbonColor?, engravedName?, body, visible: bool, anonymous: bool, fulfilled: bool, createdAt, editCount, position: {zone, x, y}, ownerId, lit?: bool (lantern only) }`. Zone (`canopy`/`branch`/`trunk`) is derived from `fulfilled` and `age > 100 days`, not stored redundantly. Track `createdAt` to compute the 30-minute edit window client- or server-side (never surface the raw countdown).

## Design Tokens Recap
See the Colors/Typography/Spacing tables above — copy those literally into the target codebase's theme/tokens file.

## Assets
Located in `assets/`, all final art to be used as-is (not placeholders):
- `canopy.webp`, `branch.webp`, `trunk.webp` — the 3 vertically-stacked tree illustration layers (painterly gouache style, see `TreeArt.dc.html` for exact crop/offset math — canopy 0–520px, branch 430–950px, trunk 850–1500px of one continuous 1500px-tall painting, masked with soft gradient blends where they overlap).
- `paper.png` / `fine-paper.png` — 소원지 / 고운 소원지 offering icons.
- `ribbon-tag-{baek,cheong,heuk,hwang,jeok}.png` — the 5 ribbon/name-tag color variants (white/blue/black/yellow/red).
- `lantern.png` — 등불.
- `stone.png` / `stone-cairn.png` — single engraved stone / trunk-base stone pile.
- `ribbon.png` — base ribbon art (unused variant, kept for reference).

No icon font or emoji is used anywhere in this design — all iconography is these illustrated PNG/WebP assets.

## Files
- `IROORI 소원나무 v2.dc.html` — the full design reference; open in a browser (needs `support.js` alongside it) to see every screen as a labeled gallery.
- `TreeArt.dc.html` — the tree background component: renders `canopy.webp`/`branch.webp`/`trunk.webp` at a given vertical `offsetY` (0–656) to produce the canopy/branch/trunk scroll states from one continuous painting.
- `WishLayer.dc.html` — renders the positioned wish objects (paper/fine-paper/ribbon/lantern/faded/stone/cairn/gold "fulfilled"/back-of-paper) with their sway/glow animations, driven by an `items` array of `{pos, <type>: true, ribbonSrc?}`.
- `assets/` — all illustration assets listed above.
- `support.js` — the prototyping tool's runtime; only needed to preview the `.dc.html` files in a browser, not part of the target implementation.

The anchor coordinate table and offset math embedded in the main file's inline script (`ANCHORS`, `RIBBON_SRC`) show exactly how objects are positioned per zone — useful as a reference for building a real (likely randomized/data-driven) placement system, not meant to be copied as fixed coordinates for production content.
