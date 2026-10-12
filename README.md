# Smart Talk

Smart Talk 프론트엔드 프로젝트입니다.

## 1. 프로젝트 다운로드

Git과 Node.js 버전 관리 도구인 nvm을 먼저 준비합니다. 프로젝트는 Node.js 22와 pnpm 10.25.0을 사용합니다.

- [Git 설치](https://git-scm.com/downloads)
- [nvm 설치 안내](https://github.com/nvm-sh/nvm#installing-and-updating) · [Windows용 nvm](https://github.com/coreybutler/nvm-windows)

터미널에서 저장할 폴더로 이동한 뒤 실행합니다.

```sh
git clone https://github.com/smalltalk-today/front.git
cd front
```

저장소 접근 권한이 필요하다는 오류가 나오면 GitHub 로그인과 저장소 권한을 확인합니다.

## 2. 실행 환경 준비

이후 명령은 모두 프로젝트 루트(`front`)에서 실행합니다. macOS·Linux의 nvm 기준입니다.

```sh
nvm install
nvm use
corepack enable
pnpm --version
pnpm install --frozen-lockfile
```

`pnpm --version` 결과는 `10.25.0`이어야 합니다. `corepack` 명령이 없으면 `npm install --global corepack` 실행 후 다시 진행합니다. Windows용 nvm은 위 두 nvm 명령 대신 `nvm install 22`와 `nvm use 22`를 사용합니다.

처음 실행한다면 환경변수 예제 파일을 복사합니다.

```sh
cp .env.example .env.local
```

Windows PowerShell에서는 `Copy-Item .env.example .env.local`을 사용합니다. 이미 `.env.local`이 있다면 덮어쓰지 말고 [환경변수 가이드](guide/project/environment.md)를 참고해 누락된 값만 추가합니다.

## 3. 개발 서버 실행

```sh
pnpm dev
```

터미널에 서버 준비 완료 메시지가 나오면 [http://localhost:3000](http://localhost:3000)에 접속합니다. 다른 포트로 실행됐다면 터미널의 `Local` 주소를 사용합니다.

서버 종료는 `Ctrl+C`입니다. 다음 실행부터는 프로젝트 루트에서 `nvm use`와 `pnpm dev`만 실행하면 됩니다. 환경변수를 변경했다면 서버를 재시작합니다.

## 참고 문서

실행 외 상세 내용은 아래 문서를 참고합니다.

- [개발 가이드 전체 목차](guide/README.md)
- [빌드·프로덕션 실행](guide/project/setup.md) · [환경변수](guide/project/environment.md)
- [pnpm 사용·설치 문제 해결](guide/workflow/pnpm.md)
- [FSD 구조](guide/architecture/fsd.md) · [Server / Client·SSR](guide/architecture/rendering.md)
- [코드 규칙](guide/conventions/code.md) · [타입 규칙](guide/conventions/types.md)
- [상태 관리](guide/data/state.md) · [API](guide/data/api.md) · [MSW](guide/data/mocking.md)
- [디자인 시스템](guide/ui/design-system.md) · [로그인 확장](guide/auth/extension.md)
- [Git·PR](guide/workflow/git.md) · [Projects·이슈](guide/workflow/projects.md) · [품질 검사](guide/workflow/quality.md)
- [셋업 계획](guide/project/setup-plan.md)
