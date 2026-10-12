# pnpm 사용·협업 가이드

이 프로젝트는 Node.js 22, pnpm 10.25.0을 사용합니다. 작은 프로젝트에도 npm과 pnpm 모두 충분하지만, 이미 설정된 pnpm으로 팀의 설치 방법을 통일합니다.

## 처음 실행하기

프로젝트 루트에서 실행합니다. nvm이 설치되어 있다는 전제입니다.

```sh
nvm use
corepack enable
pnpm --version
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm --version` 결과는 `10.25.0`이어야 합니다. Corepack은 `package.json`의 `packageManager`를 기준으로 pnpm 버전을 선택합니다. `corepack` 명령이 없다면 `npm install --global corepack`으로 설치한 뒤 다시 실행합니다. 이 명령은 Corepack 설치용이며 프로젝트 의존성 설치는 pnpm으로 진행합니다.

환경변수 준비 등 전체 실행 절차는 [실행 가이드](../project/setup.md)를 참고합니다.

## npm과 명령어 비교

| 작업                | npm                                    | pnpm                             |
| ------------------- | -------------------------------------- | -------------------------------- |
| 전체 의존성 설치    | `npm install`                          | `pnpm install`                   |
| 잠금 파일 기준 설치 | `npm ci`                               | `pnpm install --frozen-lockfile` |
| 일반 패키지 추가    | `npm install axios --save-exact`       | `pnpm add -E axios`              |
| 개발용 패키지 추가  | `npm install -D prettier --save-exact` | `pnpm add -DE prettier`          |
| 패키지 제거         | `npm uninstall axios`                  | `pnpm remove axios`              |
| 개발 서버           | `npm run dev`                          | `pnpm dev`                       |
| 빌드                | `npm run build`                        | `pnpm build`                     |
| 프로젝트 도구 실행  | `npm exec prettier -- --check .`       | `pnpm exec prettier --check .`   |

위 패키지 이름은 사용 예시입니다. 필요한 패키지만 추가합니다. `.npmrc`의 `save-exact=true` 덕분에 `-E`를 생략해도 직접 의존성은 정확한 버전으로 저장됩니다.

`pnpm install --frozen-lockfile`은 잠금 파일을 변경하지 않습니다. 파일이 없거나 `package.json`과 맞지 않으면 실패합니다. 일반 설치와 같은 명령은 아니며, `npm ci`와 내부 동작이 완전히 동일한 것도 아닙니다.

## 잠금 파일과 충돌 원인

`package.json`은 필요한 패키지를 선언하고, `pnpm-lock.yaml`은 하위 의존성까지 포함한 정확한 버전과 의존 관계를 기록합니다. npm의 `package-lock.json`도 같은 목적입니다.

두 사람이 다른 브랜치에서 패키지를 추가해도 공통 하위 의존성이나 같은 기록 영역이 바뀌면 Git 충돌이 날 수 있습니다. 패키지 관리자 버전 차이, 오래된 브랜치에서의 변경, 잠금 파일 삭제 후 재생성도 불필요한 변경을 늘릴 수 있습니다. pnpm으로 바꿔도 충돌이 사라지지는 않습니다.

## 팀 협업 규칙

1. 모두 Node.js 22와 pnpm 10.25.0을 사용합니다. `packageManager`는 버전 기준이며, 실제 `pnpm --version`도 확인합니다.
2. 프로젝트 의존성 설치에 npm·Yarn을 섞지 않습니다. 잠금 파일은 `pnpm-lock.yaml`을 사용합니다.
3. 패키지 추가·업데이트 전 작업을 저장하고 최신 기준 브랜치 변경을 반영합니다. 브랜치 운영은 [Git 가이드](git.md)를 따릅니다.
4. 의존성을 바꾸지 않는 최초 설치·pull 후 설치에는 `pnpm install --frozen-lockfile`을 사용합니다.
5. 의존성 변경 시 `pnpm add`, `pnpm remove` 등을 사용하고, `package.json`과 `pnpm-lock.yaml` 변경을 함께 커밋합니다. 설정을 변경했다면 관련 설정 파일도 포함합니다.
6. 잠금 파일을 삭제하거나 `.gitignore`에 넣지 않습니다. `node_modules`는 커밋하지 않습니다.
7. 의도하지 않은 대량 변경이 나오면 버전·설정 차이부터 확인합니다. 단순 설치만 한 PR에 불필요한 잠금 파일 변경을 포함하지 않습니다.

CI도 `pnpm install --frozen-lockfile`을 사용합니다. 정확한 직접 의존성 버전과 CI 검사는 재현성을 높이지만 Git 충돌 자체를 막지는 않습니다.

## 충돌 해결하기

merge 중 `pnpm-lock.yaml`이 충돌했다면 다음 순서로 해결합니다.

1. `package.json`에 충돌이 있다면 먼저 해결합니다. 두 브랜치에서 추가한 패키지는 필요한 항목을 모두 유지하고, 같은 패키지의 버전이 다르면 팀이 사용할 버전을 결정합니다. 다른 설정 파일의 충돌도 먼저 해결합니다.
2. `pnpm --version`이 `10.25.0`인지 확인합니다.
3. 잠금 파일 충돌 표시를 남긴 상태에서 `pnpm install`을 실행합니다. pnpm이 자동 해결을 시도합니다. 이 단계에서는 잠금 파일을 갱신해야 하므로 `--frozen-lockfile`을 사용하지 않습니다.
4. 자동 해결이 실패하면 오류를 확인하고 해결합니다. 잠금 파일 전체를 삭제하거나 한쪽 버전을 무조건 선택하지 않습니다.
5. 의도한 패키지·버전이 유지됐는지 확인하고 검증합니다.

```sh
git diff -- package.json pnpm-lock.yaml
git diff --check
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

pnpm의 자동 해결 결과가 항상 팀의 의도와 일치하는 것은 아닙니다. 변경 내역과 검증 결과를 확인한 뒤 해결한 파일을 스테이징하고 merge를 완료합니다.

```sh
git add package.json pnpm-lock.yaml
git merge --continue
```

위 마지막 명령은 merge 진행 중일 때 사용합니다. 다른 충돌 파일도 해결·스테이징해야 합니다.

## 설치가 실패할 때

| 상황                                  | 대응                                                                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| pnpm 버전이 다름                      | 프로젝트 루트에서 `corepack enable` 후 버전 재확인                                                                          |
| frozen 설치에서 설정·잠금 파일 불일치 | 누락된 커밋·미해결 충돌 확인. 의도한 의존성 변경이면 `pnpm install` 후 변경 검토·두 파일 함께 커밋                          |
| 실수로 `npm install` 실행             | 새 `package-lock.json`을 커밋하지 않음. 의도한 패키지 변경 여부를 먼저 확인한 뒤 pnpm으로 다시 반영                         |
| 설치 스크립트 차단                    | 현재 허용 목록은 `pnpm-workspace.yaml`의 MSW·unrs-resolver. 새 패키지에 필요한 스크립트인지 검토한 뒤 설정 변경을 함께 리뷰 |

## 공식 참고 문서

- [pnpm 10 설치 옵션](https://pnpm.io/10.x/cli/install)
- [pnpm 10 잠금 파일·Git 충돌 처리](https://pnpm.io/10.x/git)
- [npm 잠금 파일](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/)
