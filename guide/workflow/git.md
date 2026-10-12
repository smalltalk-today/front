# Git·PR

기본 브랜치는 `dev`, 배포 가능한 상태는 `main`입니다. 작업 브랜치는 최신 dev에서 `type/이슈번호-kebab-case` 형식으로 분기합니다. type은 feat, fix, refactor, docs, style, chore, test 사용. 예: `feat/12-add-profile`. dev와 main에 직접 push하지 않습니다.

| PR 방향           | 용도                         | 병합 방식             |
| ----------------- | ---------------------------- | --------------------- |
| 작업 브랜치 → dev | 일반 개발·문서·설정 변경     | Squash and merge      |
| dev → main        | 승인된 개발 내용의 main 반영 | Create a merge commit |
| main → dev        | main 반영 후 이력 동기화     | Create a merge commit |

완료된 작업 브랜치는 자동 삭제합니다. dev·main은 삭제 금지 규칙으로 유지합니다. 두 장기 브랜치의 공통 이력을 보존하기 위해 main 반영과 동기화에서는 squash·rebase를 사용하지 않습니다. dev의 merge commit 허용은 main 동기화용이며 일반 작업은 squash를 선택합니다.

```sh
git fetch origin
git switch dev
git pull --ff-only origin dev
git switch -c feat/12-add-profile
```

PR 제목은 `type: 내용` 또는 `type(scope): 내용` 형식으로 작성합니다. PR Convention workflow가 브랜치와 제목을 검사합니다. Conventional Commits 예: `feat: add profile editor`, `fix: preserve modal focus`, `chore: configure CI`. PR은 문제와 결과를 먼저 설명하고 테스트·관련 guide 링크를 포함합니다.

GitHub 원격은 [smalltalk-today/front](https://github.com/smalltalk-today/front)입니다. dev·main 모두 PR, 작성자 외 승인 1개, 변경 후 기존 승인 취소, 리뷰 대화 해결, force push·삭제 금지를 적용합니다. 두 명 팀에서 작성자 외 다른 한 명이 승인합니다. 관리자 우회는 허용하지 않습니다. 필수 검사는 GitHub Actions 출처의 `quality`, `pr-conventions`이며 main에는 `main-source`도 필요합니다. CI는 dev·main 대상 PR과 두 브랜치의 push에서 실행됩니다. 브랜치 이름 규칙은 dev·main을 제외한 작업 브랜치에 적용합니다.

## main 출발 브랜치 제한

main 대상 PR은 같은 저장소의 dev에서만 허용합니다. 다른 작업 브랜치 또는 fork의 dev에서 온 PR은 `main-source`가 실패해 병합할 수 없습니다. PR 생성 자체는 가능하지만 승인만으로 실패한 검사를 우회할 수 없습니다.

`main-source.yml`은 `pull_request_target`으로 보호된 기본 브랜치 dev의 코드만 실행합니다. PR 코드를 checkout하거나 실행하지 않으며, 검증 결과는 PR head SHA에 commit status로 등록합니다. 기본 브랜치에 검사 파일이 병합되기 전에는 필수 `main-source` 상태가 없어 main 병합이 대기합니다. 운영 전환 PR을 dev에 승인·병합한 후 main PR을 열거나 기존 PR을 다시 열어 검사를 실행합니다.

## PR 템플릿

작업 브랜치 → dev는 기본 PR 템플릿을 사용합니다. 문제와 변경 결과, 실행한 검증, 관련 이슈를 기록합니다. 적용되지 않는 검사는 N/A와 이유를 적습니다.

dev → main은 [main 반영 PR 생성](https://github.com/smalltalk-today/front/compare/main...dev?expand=1&template=release.md) 링크로 `release.md` 템플릿을 사용합니다. 포함된 dev PR, 사용자에게 달라지는 동작, 검증 결과를 기록하고 Merge commit으로 반영합니다. main → dev 동기화는 기본 템플릿의 대상 항목을 동기화로 바꿔 작성합니다.

작업 PR의 `Closes #번호`는 기본 브랜치 dev 병합 시 이슈를 종료합니다. main 반영 PR에서는 이미 종료된 이슈를 `Refs #번호`로 참조합니다. main 반영은 배포 실행과 별개입니다.

## Discord PR 알림

`#프론트엔드`는 대화용, `#프론트-pr`은 자동 알림용으로 사용합니다. `.github/workflows/discord-pr.yml`은 일반 PR 생성, Draft에서 리뷰 준비 완료 전환, 머지 시 알림을 보냅니다. Draft 생성, 수정 커밋, 리뷰 댓글, 머지 없이 종료한 PR은 알림을 보내지 않습니다. 자동 멘션은 모두 차단합니다. 리뷰·승인은 알림의 PR 링크를 통해 GitHub에서 진행합니다.

### 최초 연결

1. Discord 관리자가 `#프론트-pr` 채널의 웹훅을 생성합니다. 채널 설정 → 연동 → 웹훅에서 생성·수신 채널을 확인합니다.
2. [저장소 Actions Secrets](https://github.com/smalltalk-today/front/settings/secrets/actions)에서 `New repository secret`을 선택합니다.
3. 이름은 `DISCORD_WEBHOOK_URL`, 값은 복사한 웹훅 URL로 저장합니다. `/github`를 붙이지 않습니다. URL은 코드·채팅·`.env`에 기록하지 않습니다.
4. workflow 변경을 기본 브랜치 `dev`에 PR로 반영합니다. 기본 브랜치에 workflow가 있어야 자동 PR 알림과 수동 테스트를 사용할 수 있습니다.
5. [GitHub Actions](https://github.com/smalltalk-today/front/actions) → `Discord PR Notifications` → `Run workflow` → `dev`를 선택해 실행합니다. Discord의 `PR 알림 연결 테스트` 메시지를 확인합니다.
6. 이후 일반 PR 생성 또는 Draft의 `Ready for review` 전환 시 리뷰 요청, 머지 시 머지 완료 메시지를 확인합니다. 기존 PR 알림은 소급 전송하지 않습니다.

Secret이 없으면 경고를 남기고 전송을 건너뜁니다. 전송 실패는 `discord-pr` job에서 확인하며, 이 job을 머지 필수 check로 지정하지 않습니다. 웹훅이 삭제·교체되면 GitHub Secret 값도 갱신합니다. GitHub 저장소의 `Settings → Webhooks`에 같은 Discord 연결을 추가하면 알림이 중복될 수 있으므로 Actions 방식만 사용합니다.

외부 fork PR에서도 Secret을 사용할 수 있도록 `pull_request_target`을 사용하되, PR 코드를 checkout하거나 실행하지 않습니다. 이벤트 JSON만 읽고 GitHub 토큰 권한은 부여하지 않습니다. 이 workflow에는 PR 코드 실행 단계를 추가하지 않습니다.

## 이슈·PR 라벨

| 이름     | 내용                           |
| -------- | ------------------------------ |
| feat     | 기능개발                       |
| fix      | 버그 수정                      |
| bug      | 버그 발생                      |
| refactor | 코드 수정, 개선                |
| docs     | 문서 작업                      |
| style    | 스타일 작업                    |
| chore    | 설정 및 빌드 업무 등 기타 작업 |
| test     | 테스트 코드 작성 및 수정       |

작업에 맞는 라벨을 하나 이상 사용합니다. `bug`는 버그 발생 보고, `fix`는 버그 수정 작업에 적용합니다. 초기 프로젝트 셋업 이슈·PR은 `chore`를 사용합니다.

## 이슈 템플릿

버그 제보는 Type=Bug·bug 라벨, 기능 제안은 Type=Feature·feat 라벨, 일반 작업은 Type=Task·chore 라벨을 자동 적용합니다. 템플릿은 기본 브랜치 dev 반영 후 활성화됩니다.

버그는 재현 방법, 기대·실제 결과, 수정 완료 조건을 기록합니다. 기능·일반 작업은 목적과 완료 조건을 기록합니다. 각 템플릿에서 dev 기준 작업 브랜치와 PR 방향을 안내합니다. [Projects·이슈 운영](projects.md)에서 작업 보드와 상태 기준을 확인합니다.
