# 환경 분리

| 변수                       | 공개 여부     | 용도                                       |
| -------------------------- | ------------- | ------------------------------------------ |
| `NEXT_PUBLIC_APP_ENV`      | 브라우저 공개 | develop / product (미설정 시 product)      |
| `NEXT_PUBLIC_API_BASE_URL` | 브라우저 공개 | 브라우저 API origin, 미설정 시 동일 origin |
| `API_BASE_URL`             | 서버 전용     | 서버 HTTP 호출 origin                      |
| `SITE_URL`                 | 서버 전용     | metadata·robots·sitemap URL                |

`.env.example`만 커밋합니다. 로컬 비밀값은 `.env.local`, CI·배포값은 플랫폼에 주입합니다. `.env.development`, `.env.production` 등 비밀값 포함 파일도 커밋하지 않습니다.

개발은 `NEXT_PUBLIC_APP_ENV=develop`, 운영은 `NEXT_PUBLIC_APP_ENV=product`입니다.
`NODE_ENV`는 Next.js 표준값 development / production / test를 유지하며 product나 develop으로 변경하지 않습니다.
공개 환경변수는 빌드 시 고정되므로 환경별로 빌드합니다.

전역 `MswProvider`는 `NODE_ENV=development`이면서 `NEXT_PUBLIC_APP_ENV=develop`일 때만
worker를 시작합니다. product에서는 페이지를 바로 렌더링합니다. production 빌드·실행은
app 환경값이 develop이어도 mock을 사용하지 않습니다. 별도 `NEXT_PUBLIC_MOCK_ENABLED`는 사용하지 않습니다.

클라이언트는 `shared/config`, 서버는 `shared/config/index.server` 사용. 동일한 Zod enum으로 환경값을 검증합니다. develop의 SITE_URL 기본값은 localhost:3000이며 product 앱 환경에서는 반드시 실제 도메인을 지정합니다. 서버 API 함수 호출에는 API_BASE_URL이 필요합니다.

API base URL은 origin 기준으로 사용합니다. `/api/...`는 origin 루트 경로라 base URL의 하위 경로를 덮어씁니다. 인증키·토큰에는 NEXT_PUBLIC 접두어를 붙이지 않습니다. 현재 API 호출에 인증 헤더 자동 삽입은 없습니다.
