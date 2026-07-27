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

Google/Email 로그인, 첫 씨앗 심기, 30일 성장 나무, 하루 한 번 마음 기록과
물 주기, 최근 기록 확인 기능이 운영 서비스에 적용되어 있습니다. 다음 구현
범위는 꽃과 열매, 공개 숲과 햇살 응원입니다.
