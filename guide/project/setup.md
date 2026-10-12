# 실행·의존성

Node.js 22 LTS, pnpm 10.25.0 사용. `.nvmrc`, `packageManager`, `engines`가 기준입니다. 직접 의존성은 exact 버전, 전이 의존성은 `pnpm-lock.yaml`에 고정합니다.

```sh
nvm install
nvm use
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

`/`는 정적 홈입니다. 참고 코드는 루트 `code temp`에 있으며 라우트로 등록되지 않습니다. `.env.local`에서 `NEXT_PUBLIC_APP_ENV=develop`을 지정하면 `pnpm dev`의 모든 페이지에서 브라우저 MSW를 사용할 수 있습니다. 이미 `.env.local`이 있다면 복사 명령으로 덮어쓰지 말고 누락된 값만 추가합니다.

팀원별 설치·훅·환경변수·CI·CodeRabbit 확인은 [개발 환경 점검](../workflow/setup-check.md)을 참고합니다.

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test:run
pnpm build
pnpm start
```

환경변수 변경 후 개발 서버를 재시작합니다. 실제 production 배포는 `NEXT_PUBLIC_APP_ENV=product`, `SITE_URL`을 지정하고 빌드합니다. `pnpm build`·`pnpm start`에서는 app 환경값이 develop이어도 MSW가 시작되지 않습니다.

ESLint는 Next.js config의 React/import/a11y 플러그인 peer 범위에 맞춰 9.39.5 사용. ESLint 10은 해당 플러그인 지원 후 함께 업그레이드합니다. 신규 의존성은 `pnpm add -E`, 개발용은 `pnpm add -DE` 사용. pnpm에서 허용한 설치 스크립트는 MSW와 unrs-resolver입니다.
