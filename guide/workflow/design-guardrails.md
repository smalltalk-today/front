# 디자인 검증과 5회 실패 중단

기존 FSD·Tailwind 4와 현재 UI 동작을 보존하며 신규 코드의 미등록 컴포넌트·토큰 사용을 차단한다. 원본 명세는 `design/`, 검사기는 `scripts/check-design.mjs`, 작업 실행기는 `scripts/task-runner.mjs`에 있다.

## 현재 적용 범위

검사 기반에 이어 기존 UI 6개와 카드 UI 9개를 Figma 원본과 대조해 승인했다. 승인과 출처의 기준은 `design/components.json`이다. 공통 UI 근거는 `design/evidence/approved-ui-spec.json`, 카드 근거는 `design/evidence/cards/approved-cards-spec.json`과 같은 폴더의 원본 자료에 있다.

| 승인 UI     | 원본 node ID | 사용 범위                                                        |
| ----------- | ------------ | ---------------------------------------------------------------- |
| Button      | `202:173`    | 등록 variant·size 조합과 안전한 native button 속성               |
| Badge       | `278:1270`   | 원본 외형과 기존 children 계약                                   |
| Modal       | `602:1829`   | 기존 open·title·onClose·children 계약                            |
| BottomSheet | `446:3012`   | 기존 열기·닫기·본문·선택적 CTA 계약                              |
| Toast       | `402:1469`   | 기존 알림 상태·타이머·닫기 계약을 유지하는 내부 UI               |
| Toaster     | `402:1469`   | Toast의 비시각 composition 호스트. Providers에서 기존 API로 사용 |

카드 승인 UI는 CardHeader·CardTabs·CardNavigation·CardRanking·CardIcon·CardLogo·CardFeed·ArticleSummary·SavedCardItem이다. 카드 화면은 이 UI와 기존 공통 UI를 조합한다. 세부 동작과 반응형 기준은 [카드 화면 가이드](../ui/card-screens.md)에 기록한다. 추가 UI는 원본 대조와 등록이 필요하다.

Input은 사용자 지시로 이번 이관에서 제외했다. 기존 파일을 삭제하지 않으며 `pending` 상태로 신규 사용을 차단한다. 나머지 미이관 코드는 `design/legacy.json`의 9개 파일·51개 진단에 한해 정확한 경로·SHA-256·진단·사유·해소 단계를 고정한다. 이 목록은 원본 승인이 아니며 전체 앱의 Figma 이관 완료를 뜻하지 않는다.

기존 파일이 바뀌면 고정본 예외를 사용할 수 없다. 새 파일에서 미승인 UI를 추가로 사용하는 것도 차단한다. 신규 파일·신규 위반을 기존 목록에 자동 추가하는 명령은 제공하지 않는다. 최종 UI 이관 완료 조건은 기존 위반 목록 0개다.

루트 `app/layout.tsx`에서는 기존 글로벌 CSS import, `html`의 로컬 Pretendard 변수, 기존 Providers 연결만 인프라로 검사한다. 이 허용은 다른 경로·글꼴·스타일·provider로 확대되지 않는다.

기존 홈의 사용자 수정은 보존한다. 기준 Git blob hash는 `12138a1dbaabc3fe8f89acc0caa18df5b6429e57`이다. 승인 UI의 시각 명세와 기존 동작을 구분하며, 카드 기능 정책은 [적용 계획](../ui/design-system-adoption-plan.md)과 사용자 지정 CardFeed 코드를 따른다. 저장은 메모리만 사용하며 localStorage·sessionStorage를 추가하지 않는다. API는 후속 연결 범위다.

원본 토큰 142개는 변경하지 않는다. `globals.css`·`colors.css`·`typography.css`의 기존 바이트를 보존하고, 이번 승인 UI에 필요한 원본 일치 바인딩은 `layout.css`가 가져오는 `approved-ui.css`에 둔다. `layout.css`의 승인 geometry는 원본의 개별 치수와 기존 Toaster의 모바일 하단 94px·데스크톱 하단 45px·최대 너비 384px을 고정한다. 기존 `md=48rem`을 유지하고 카드 화면의 `xl=80rem`, 실제 CardFeed 글꼴의 `sm=40rem`을 원본 근거와 함께 등록한다. 이 값들은 새 범용 spacing 척도의 근거가 아니다.

BottomSheet는 화면 너비의 100%를 사용하되 최대 768px로 제한해 하단 중앙에 배치한다. 최대 너비는 사용자가 지정했으며, 768px은 Figma 태블릿 프레임의 너비다. 넓은 화면 배치에 대한 별도의 Figma 바텀시트 명세는 없다.

BottomSheet 손잡이는 드래그와 키보드로 높이를 조절한다. 동적 높이는 해당 컴포넌트의 `dialog.style.height` 한 곳에서만 허용하며 최소 380px에서 화면 높이의 최대 80%로 제한한다. 화면이 너무 낮으면 최솟값도 그 최대 높이에 맞춘다. 다른 요소·속성의 스타일 직접 변경은 계속 차단한다.

## 실행 명령

Node 22.22.2 이상 22.x와 프로젝트의 pnpm 10.25.0을 사용한다.

```sh
pnpm check:design
pnpm check:design:watch
pnpm dev --port 3210
pnpm verify
```

`pnpm dev`는 초기 검사와 감시기 준비가 끝난 후 Next를 실행한다. 포트·hostname 등 Next 옵션과 환경변수를 전달하며 검사한 현재 프로젝트를 실행한다. 다른 프로젝트 디렉터리를 이 명령으로 실행하지 않는다. 개발 종료·감시기 오류·서버 종료 시 이 명령이 시작한 프로세스만 정리한다.

저장 감시는 파일·행·규칙과 원인을 터미널에 표시한다. 화면에 별도 검증 UI를 넣지 않는다. 수정 중 오류 알림과 최종 빌드·커밋·CI의 실패 차단을 구분한다.

`pnpm check`에는 디자인 검사·기존 lint·format·typecheck·단위 테스트가 포함된다. `pnpm verify`는 check → 실제 guardrails 실증 → 서버 경계 음성 시험 → 정상 production build를 순서대로 실행한다. 직접 `pnpm build`도 디자인 검사부터 수행한다.

## 한 작업의 검증 순서

```sh
pnpm task --assert-open card-screens-migration
# 같은 작업의 코드를 수정한다.
pnpm task card-screens-migration -- pnpm verify
```

이번 카드 화면 작업은 `card-screens-migration`으로 고정한다. 같은 작업은 같은 ID로 유지한다. 전체 검증 명령을 시작하기 전에 1회를 기록하고 최초 시도부터 최대 5회다. 성공하면 완료 ID로 고정한다. 별도 작업에는 새 ID를 사용하되 실패한 같은 작업을 새 ID로 우회하지 않는다.

5번째 실패 후에는 `TASK_BLOCKED`로 자동 진행을 중단한다. 6번째 명령과 수정 전 assert-open을 거부한다. 실행 오류·중간 종료·손상된 기록도 성공이나 새 작업으로 취급하지 않는다. 상태와 잠금은 `.design-state/`, 결과와 다음 조치는 `reports/<task-id>.json`에 저장한다. 두 폴더는 Git 제외 대상이다.

사용자가 재개를 명시하고 원인을 해결한 뒤에만 다음 명령을 사용한다. 이전 회차 기록은 남는다.

```sh
pnpm task --resume card-screens-migration --reason "사용자 재개 지시와 원인 해결 내용"
```

에이전트는 blocked 시 코드를 더 수정하거나 다음 단계로 넘어가지 않고, 시도 기록과 남은 원인을 현재 대화에 보고한다. 원본 부재·로그인·제품 정책 미결은 의미 없는 코드 재시도 대신 바로 알린다.

## 컴포넌트와 토큰 규칙

- 검사 범위는 루트 `app/`와 `src/`이며 미방문 라우트도 포함한다. FSD 공개 API·별칭·재수출을 따라 실제 컴포넌트 원본을 확인한다.
- 원본 확인·등록을 마친 UI만 새 화면에서 사용한다. route/widget의 구조 조합은 허용하되 자체 버튼·카드·입력 외형을 만드는 데 쓰지 않는다.
- Button의 primary·secondary는 L/M/S/XS만 허용하고 생략 시 M을 사용한다. icon은 icon 크기만 사용하며 link·text에는 size를 지정하지 않는다. 각 enum이 등록돼 있어도 원본에 없는 variant·size 교차 조합은 차단한다.
- Button의 typed native 속성·ref·submit·이벤트 전달은 허용한다. `style`·`dangerouslySetInnerHTML`·`color`는 차단하며, 숨긴 spread로 전달해도 허용하지 않는다. 호출부 `className`은 허용된 배치 역할로만 사용하고 색상·타이포·패딩·높이 등 외형을 덮어쓰지 않는다.
- Tailwind className, CVA·cn/clsx·배열·조건 분기에서도 등록된 utility만 사용한다. Tailwind에 기본 제공된다는 이유로 색상·간격·폰트·breakpoint를 허용하지 않는다.
- 등록 색과 같은 직접 색상도 허용하지 않는다. 해석할 수 없는 동적 class, inline style·HTML 주입, props spread를 통한 외형 덮어쓰기도 차단한다.
- 기존 로컬 Pretendard와 승인된 에셋은 경로·해시 계약을 지킨다. 미등록 폰트·SVG·외부 UI를 임의로 추가하지 않는다.
- 명세·별칭·스타일의 누락·불일치·손상은 실패로 처리한다. 오류를 없애려고 허용 목록·기준 해시·검사기를 자동 완화하지 않는다.

새 컴포넌트·토큰 승인은 원본의 node ID·속성·variant·값을 확인한 별도 변경이다. 대응 원본이 없으면 디자인 누락으로 보고한다. 기존 위반 고정은 새 UI 승인과 다르다.

Toast는 `toast(message)`·`toast.success(message)`·`toast.error(message)`로 호출한다. 새 알림은 이전 알림을 대체하고 기본 표시 시간은 4초다. hover·focus 중에는 타이머를 멈추고 모두 해제되면 전체 duration으로 다시 시작한다. duration이 0 이하이면 직접 닫기 전까지 유지한다. 기존 info API는 원본의 상태 아이콘 없는 외형에 대응하며 새 알림 종류를 추가하지 않는다.

## 실제 차단 검증

```sh
pnpm verify:guardrails
```

현재 앱의 임시 복사본에서 미등록 UI·직접 색상을 넣어 실제 CLI와 저장 감시기의 감지를 확인한다. 별도 프로세스에서 같은 작업을 5번 실패시킨 뒤, 6번째 명령이 marker 파일을 생성하지 못하는지 검사한다. 수정 게이트 차단, 정상 복구, 시험용 파일·프로세스 정리도 확인한다.

실증의 내부 명령은 `check:design`만 사용한다. 전체 verify를 재귀 호출하지 않으며 의도적인 내부 실패를 실제 작업의 실패 횟수에 섞지 않는다. 원본 앱과 사용자 파일·실제 작업 상태를 주입 시험에 사용하지 않는다. 결과는 `reports/guardrails-proof.json`에 남는다.

## 커밋과 CI

기존 Husky는 lint-staged 성공 후 디자인 검사를 수행한다. 기존 훅 경로를 교체하지 않는다. Quality CI는 같은 `pnpm verify`를 실행하고 기존 `quality` 상태 검사 이름을 유지한다. PR convention·FSD·서버 경계 검사는 그대로 유지한다.

로컬 실행기는 경유한 명령만 통제한다. 수동 편집·직접 명령·훅 우회까지 보장하지 않는다. 원격 branch protection의 필수 검사 연결 여부는 별도 확인해야 한다. `AGENTS.md`는 현재 Git 제외 대상이므로 팀 공유 정책은 이 문서와 실행 스크립트·CI를 기준으로 한다.

실행기는 환경변수 전체를 기록하지 않으며 알려진 비밀 환경값은 저장 로그에서 마스킹한다. 임의 로그의 모든 민감정보를 탐지하는 장치는 아니므로 비밀값을 출력하는 명령을 검증 명령으로 사용하지 않는다.
