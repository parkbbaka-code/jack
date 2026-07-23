# IROORI

기록으로 소원을 키우는 조용한 디지털 숲입니다.

## 시작하기

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Firebase 값을 `.env.local`에 입력하기 전에도 랜딩 페이지와 순수 성장 로직
테스트를 실행할 수 있습니다.

## 검증

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Cloudflare Workers 환경은 `pnpm preview`로 별도 검증합니다.

## 핵심 문서

- [`docs/IROORI-DEVELOPMENT-BLUEPRINT.md`](docs/IROORI-DEVELOPMENT-BLUEPRINT.md)
- [`firestore.rules`](firestore.rules)
- [`features/tree/lib/growth.ts`](features/tree/lib/growth.ts)

## 현재 범위

프로젝트 기반과 보안 경계를 구축한 단계입니다. Google/Email 로그인 UI와
Firebase 프로젝트 연결은 실제 Firebase 환경값이 준비되면 이어서 구현합니다.
