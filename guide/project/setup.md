# 실행·의존성

Node.js 22 LTS, pnpm 10.25.0 사용. `.nvmrc`, `packageManager`, `engines`가 기준입니다. 직접 의존성은 exact 버전, 전이 의존성은 `pnpm-lock.yaml`에 고정합니다.

```sh
nvm use
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

`/`는 정적 홈, `/dev/demo`는 개발 전용 검증 화면입니다. `.env.local`에서 `NEXT_PUBLIC_MOCK_ENABLED=true`가 필요합니다.

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test:run
pnpm build
pnpm start
```

환경변수 변경 후 개발 서버를 재시작합니다. 실제 production 배포는 `NEXT_PUBLIC_APP_ENV=production`, `SITE_URL`을 지정하고 빌드합니다. MSW 사용 여부와 무관하게 production에서 데모는 404입니다.

ESLint는 Next.js config의 React/import/a11y 플러그인 peer 범위에 맞춰 9.39.5 사용. ESLint 10은 해당 플러그인 지원 후 함께 업그레이드합니다. 신규 의존성은 `pnpm add -E`, 개발용은 `pnpm add -DE` 사용. pnpm에서 허용한 설치 스크립트는 MSW와 unrs-resolver입니다.
