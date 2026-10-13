# 개발 환경 점검

팀원이 처음 clone하거나 설치·커밋·PR 검사가 실패할 때 확인합니다. Node 버전 통일에는 nvm을 사용하며 Docker는 필수 도구가 아닙니다.

## Node·pnpm

프로젝트 루트에서 실행합니다. nvm이 설치되어 있어야 합니다.

```sh
nvm install
nvm use
node --version
corepack enable
pnpm --version
pnpm config get engine-strict
pnpm install --frozen-lockfile
```

기대 결과: Node `v22.22.2` 이상(22.x), pnpm `10.25.0`, engine-strict `true`. Corepack이 없다면 `npm install --global corepack` 후 다시 실행합니다.

`.nvmrc`의 `22`는 Node 메이저 버전 기준이며 패치 버전까지 고정하지 않습니다. Node 19·23을 사용하던 팀원도 `nvm install`·`nvm use`로 전환할 수 있고 기존 버전은 유지됩니다. 전환은 현재 터미널에 적용되므로 새 터미널·IDE 터미널에서도 확인합니다. nvm 자동 전환 설정은 별도입니다.

`.npmrc`의 `engine-strict=true`와 `package.json`의 `engines.node`가 잘못된 Node 버전으로 의존성을 설치하는 것을 차단합니다. 모든 실행 명령을 차단하거나 Node를 자동 설치하는 기능은 아닙니다. 버전 오류를 우회하지 말고 Node를 전환합니다.

## 환경변수·MSW

`.env.local`이 없을 때만 `.env.example`을 복사합니다. 기존 파일은 덮어쓰지 않습니다.

| 확인 항목             | 로컬 기준                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_ENV` | `develop`: pnpm dev에서 전역 브라우저 MSW 사용. `product`: 실제 API 사용                                                  |
| `SITE_URL`            | `http://localhost:3000`; production 배포에는 실제 도메인 지정                                                             |
| API 주소              | 실제 API 연결 시 `NEXT_PUBLIC_API_BASE_URL`·`API_BASE_URL` 설정. 자세한 계약은 [환경변수](../project/environment.md) 참고 |
| MSW worker            | `public/mockServiceWorker.js` 존재                                                                                        |

환경변수 변경 후 개발 서버를 재시작합니다. `NEXT_PUBLIC_*`는 브라우저에 공개되므로 비밀값을 넣지 않습니다. 배포 환경은 `NEXT_PUBLIC_APP_ENV=product`로 설정하고 환경별로 빌드합니다. production에서는 develop으로 지정해도 MSW가 시작되지 않습니다.

## Husky·lint

```sh
git config --get core.hooksPath
cat .husky/pre-commit
pnpm lint
pnpm format:check
```

hooksPath는 `.husky/_`, pre-commit 내용은 `pnpm exec lint-staged`여야 합니다. 일반 의존성 설치의 `prepare` 단계에서 Husky가 연결됩니다. 연결이 없다면 Node·의존성 설치를 확인한 뒤 `pnpm exec husky`로 재설정합니다.

실제 commit에서는 staged 파일에 ESLint `--fix`·Prettier가 실행되어 파일을 수정할 수 있습니다. 확인 목적으로 임의 commit을 만들지 않습니다. `pnpm lint`·`pnpm format:check`는 전체 파일을 수정 없이 검사합니다.

## 전체 검증·CI

```sh
pnpm check
pnpm test:boundary
pnpm build
```

`pnpm check`는 lint·format·타입·테스트를 실행합니다. 서버 경계 검사와 production build는 별도입니다. CI 설정은 `.github/workflows/ci.yml`에서 Node 22, frozen 설치, 위 검사를 확인합니다. 실제 성공 여부는 GitHub Actions의 `quality` 결과로 확인합니다. PR 제목·브랜치 규칙은 `pr-conventions` 결과로 확인합니다.

## CodeRabbit·PR 알림

`.coderabbit.yaml`에는 자동 리뷰가 활성화되어 있고 Draft 리뷰는 비활성화되어 있습니다. 설정 파일 존재만으로 GitHub 앱 연결이나 리뷰 성공을 보장하지 않습니다.

1. 저장소 관리자가 GitHub의 설치된 앱 설정에서 CodeRabbit 설치 여부와 `smalltalk-today/front` 접근 권한을 확인합니다.
2. 프로젝트 규칙상 허용된 기존 일반 PR의 Conversation·Checks에서 CodeRabbit 봇 댓글과 처리 결과를 확인합니다. Draft는 Ready for review 전환 후 확인합니다.
3. 리뷰 결과 대신 건너뛰기·오류 안내가 있으면 그 이유와 앱의 저장소 설정을 확인합니다. 필요할 때 담당자가 공식 문서의 수동 리뷰 절차를 따릅니다.
4. Discord PR 알림 수신과 CodeRabbit 리뷰는 별도 연동입니다. 알림 수신만으로 리뷰 성공을 판단하지 않습니다.

작업 PR은 dev를 대상으로 작성합니다. main 대상 PR은 같은 저장소의 dev에서만 생성하고, 병합·배포는 별도 승인 후 진행합니다. dev·main 직접 push는 금지합니다.

## 참고

- [pnpm 10 engine-strict](https://pnpm.io/10.x/settings#enginestrict)
- [nvm 사용법](https://github.com/nvm-sh/nvm#usage)
- [CodeRabbit 시작 가이드](https://docs.coderabbit.ai/getting-started/quickstart)
