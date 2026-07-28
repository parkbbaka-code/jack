# OG 이미지 생성 스파이크 결과

검증일: 2026-07-28

## 결론

현재 Next.js 16 + OpenNext Cloudflare Workers 구성에서는 동적 OG 이미지 생성을
Phase 1의 배포 경로에 포함하지 않는다. 공유 페이지는 **정적 OG 이미지**를 사용한다.

## 확인한 방식

1. `next/og`의 `ImageResponse`
   - Next.js 프로덕션 빌드는 성공했다.
   - OpenNext의 로컬 Cloudflare Worker에서 실제 요청 시 HTTP 500이 발생했다.
   - OpenNext Cloudflare 문서도 일반적으로 Edge runtime export를 제거하도록 안내한다.
2. `workers-og`
   - Cloudflare Workers용 라이브러리로 검토했다.
   - 그러나 현재 Next.js 16 Turbopack/OpenNext 빌드에서 WASM 모듈 해석 오류로
     번들을 만들 수 없었다.

## Phase 1 결정

- `/`과 `/wishtree`는 정적 OG 이미지를 사용한다.
- `/s/[shareId]`도 정적 "이루리 소원나무" 이미지로 통일한다.
- 공유 OG에 소원 본문·이름·공개 여부를 넣지 않는다. 정적 폴백은 프라이버시에도 안전하다.
- `/s/[shareId]`의 `noindex` 규칙은 그대로 적용한다.

## 이후 선택지

개별 소원 텍스트가 포함된 동적 OG가 꼭 필요해질 경우, Next 앱 내부가 아니라
`workers-og`를 직접 번들하는 **별도 Cloudflare Worker**를 만들고,
OG 메타데이터가 그 Worker의 이미지 URL을 가리키게 한다. 이 선택은 추가 Worker와
운영 비용·보안 검토가 필요하므로 Phase 1 배포 뒤 별도 승인으로 진행한다.
