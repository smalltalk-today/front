# Git·PR

main은 배포 가능한 상태. 작업 브랜치는 `type/이슈번호-kebab-case` 형식으로 main에서 분기합니다. type은 feat, fix, refactor, docs, style, chore, test 사용. 예: `chore/1-project-setup`. develop은 만들지 않습니다. PR 통과 후 squash merge, 완료 브랜치는 자동 삭제합니다. 초기 셋업도 발급된 이슈 번호로 작업 브랜치를 만듭니다.

PR 제목은 `type: 내용` 또는 `type(scope): 내용` 형식으로 작성합니다. PR Convention workflow가 브랜치와 제목을 검사합니다. Conventional Commits 예: `feat: add profile editor`, `fix: preserve modal focus`, `chore: configure CI`. PR은 문제와 결과를 먼저 설명하고 테스트·관련 guide 링크를 포함합니다.

GitHub 원격은 [smalltalk-today/front](https://github.com/smalltalk-today/front)입니다. 최초 main은 빈 초기 커밋으로 생성하고 프로젝트 설정은 feature 브랜치의 PR로 반영합니다. main 보호 ruleset은 PR 반영, 작성자 외 승인 1개, 변경 후 기존 승인 취소, 리뷰 대화 해결, force push·삭제 금지, 선형 이력을 적용합니다. 두 명 팀에서 작성자 외 다른 한 명이 승인합니다. 관리자도 우회하지 않습니다. 병합은 squash만 허용합니다. 작업 브랜치 이름은 별도 ruleset으로 검사합니다. 추가 승인 조건은 사용하지 않습니다. 필수 CI check 지정은 첫 PR 실행 결과에서 실제 이름과 GitHub Actions 출처를 확인한 뒤 적용합니다. 준비한 check 이름은 `quality`, `pr-conventions`입니다. 템플릿·CI 파일은 저장소에 준비되어 있습니다. 배포 URL/비밀값은 GitHub/배포 플랫폼 설정으로 주입합니다.

## Discord PR 알림

`#프론트엔드`는 대화용, `#프론트-pr`은 자동 알림용으로 사용합니다. `.github/workflows/discord-pr.yml`은 일반 PR 생성, Draft에서 리뷰 준비 완료 전환, 머지 시 알림을 보냅니다. Draft 생성, 수정 커밋, 리뷰 댓글, 머지 없이 종료한 PR은 알림을 보내지 않습니다. 자동 멘션은 모두 차단합니다. 리뷰·승인은 알림의 PR 링크를 통해 GitHub에서 진행합니다.

### 최초 연결

1. Discord 관리자가 `#프론트-pr` 채널의 웹훅을 생성합니다. 채널 설정 → 연동 → 웹훅에서 생성·수신 채널을 확인합니다.
2. [저장소 Actions Secrets](https://github.com/smalltalk-today/front/settings/secrets/actions)에서 `New repository secret`을 선택합니다.
3. 이름은 `DISCORD_WEBHOOK_URL`, 값은 복사한 웹훅 URL로 저장합니다. `/github`를 붙이지 않습니다. URL은 코드·채팅·`.env`에 기록하지 않습니다.
4. workflow 변경을 기본 브랜치 `main`에 반영합니다. 반영 전에는 자동 PR 알림과 기본 브랜치의 수동 테스트가 활성화되지 않습니다.
5. [GitHub Actions](https://github.com/smalltalk-today/front/actions) → `Discord PR Notifications` → `Run workflow` → `main`을 선택해 실행합니다. Discord의 `PR 알림 연결 테스트` 메시지를 확인합니다.
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

버그 제보는 Type=Bug·bug 라벨, 기능 제안은 Type=Feature·feat 라벨, 일반 작업은 Type=Task·chore 라벨을 자동 적용합니다. 템플릿과 workflow는 현재 로컬에 준비되어 있으며 PR로 main에 반영된 이후 GitHub에서 사용합니다. 템플릿은 기본 브랜치 반영 후 활성화됩니다.

각 템플릿은 필수 입력 두 항목으로 구성합니다. [Projects·이슈 운영](projects.md)에서 작업 보드와 상태 기준을 확인합니다.
