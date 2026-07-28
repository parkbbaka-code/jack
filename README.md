# IROORI

이루리는 밤의 소원나무에 마음을 걸어 두는 조용한 디지털 숲입니다.

## 시작하기

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Firebase 값을 `.env.local`에 입력하기 전에도 랜딩 페이지와 화면 코드를
확인할 수 있습니다.

## 검증

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Cloudflare Workers 환경은 `pnpm preview`로 별도 검증합니다.

## 핵심 문서

- [`docs/DESIGN.md`](docs/DESIGN.md)
- [`firestore.rules`](firestore.rules)
- [`AGENTS.md`](AGENTS.md)

## 현재 범위

현재는 Phase 1 소원나무를 개발합니다. 개인 나무·물주기·성장·저널 기능은
나중 단계인 Phase 3을 위해 [`legacy/phase3/`](legacy/phase3/)에 보존합니다.
