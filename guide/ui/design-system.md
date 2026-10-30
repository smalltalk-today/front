# 공통 UI·토큰

Tailwind CSS 4의 @theme와 _app/styles/globals.css가 기준. canvas/surface/ink/muted/brand/line/danger 색상, spacing 4px, card radius 16px, control radius 10px, heading/display clamp 크기를 사용합니다. Pretendard 가변 폰트를 로컬 번들로 제공해 빌드 시 외부 폰트 요청이 없습니다.

## 타이포그래피

[Figma 폰트 명세](https://www.figma.com/design/iomqZrIJ4BhzwfGDg4wWHR/?node-id=319-646)의 2026-10-29 공유본 기준입니다. iOS 화면 너비 375px을 기준으로 하며, 기본 폰트 크기 간격은 2px입니다. `src/_app/styles/typography.css`에서 토큰을 관리하고 `text-title3`처럼 사용합니다. 굵기는 r=400, m=500, sb=600입니다.

| 클래스         | 크기 | 굵기 | 행간   | 자간    | 용도                       |
| -------------- | ---- | ---- | ------ | ------- | -------------------------- |
| text-headline1 | 20px | 500  | 24px   | -0.4px  | PC 랭킹 선택 헤드라인      |
| text-headline2 | 16px | 500  | 19.2px | -0.32px | 모바일 랭킹 선택 헤드라인  |
| text-title1    | 22px | 600  | 33px   | -0.44px | PC 카드 피드 기사 제목     |
| text-title2    | 18px | 600  | 27px   | -0.36px | 모바일 카드 피드 기사 제목 |
| text-title3    | 16px | 500  | 19.2px | -0.32px | 상단 랭킹 기사 제목        |
| text-title4    | 14px | 500  | 16.8px | -0.28px | 상단 랭킹 기사 제목 (14px) |
| text-body1     | 16px | 400  | 24px   | -0.16px | 스몰토크 문장              |
| text-body2     | 14px | 400  | 21px   | -0.14px | 이슈 요약                  |
| text-label1    | 16px | 600  | 16px   | -0.16px | CTA 버튼·카테고리 선택     |
| text-label2    | 15px | 400  | 15px   | -0.15px | 다른 이슈로 바꾸기 버튼    |
| text-label3    | 14px | 500  | 14px   | -0.14px | 이슈 3줄 요약 버튼         |
| text-label4    | 14px | 400  | 14px   | -0.14px | 카테고리 버튼              |
| text-label5    | 11px | 400  | 14px   | -0.11px | 내비게이션 메뉴 이름       |
| text-label6    | 16px | 400  | 19.2px | -0.32px | 카테고리 미선택            |
| text-caption1  | 12px | 500  | 12px   | -0.12px | 카테고리 뱃지              |
| text-caption2  | 12px | 400  | 12px   | -0.12px | 시간                       |

추가된 두 스타일은 기존 번호에 이어 `title4`, `label6`으로 제공합니다. 공유본의 `Title/14_r`는 이름의 r과 굵기 열의 m이 달라, 굵기 열의 m(500)을 적용했습니다. Label4의 용도에서 삭제된 ‘다른 이슈로 바꾸기 버튼’은 Label2를 사용합니다.

## 공통 UI
Tailwind CSS 4의 `@theme`와 `src/_app/styles/globals.css`가 기준입니다. 색상은 `colors.css`, 타이포그래피는 `typography.css`, 여백·radius·그림자는 `layout.css`에서 관리합니다. Pretendard를 로컬 번들로 제공해 빌드 시 외부 폰트 요청이 없습니다.

## 여백·크기

[Figma 디자인 명세](https://www.figma.com/design/iomqZrIJ4BhzwfGDg4wWHR/?node-id=286-1429)의 2026-10-29 공유 이미지 기준입니다. `--spacing: 4px`을 기본 단위로 사용합니다. 숫자형 Tailwind 간격·크기 클래스는 이 단위의 배수입니다.

| 클래스      | 값                   | 적용 요소                                |
| ----------- | -------------------- | ---------------------------------------- |
| `gap-5`     | 20px                 | 헤드라인과 콘텐츠 사이                   |
| `gap-3`     | 12px                 | 피드·저장 카드 사이, 카드 내부 요소 사이 |
| `gap-2`     | 8px                  | 카테고리 필터·버튼·요약 항목 사이        |
| `gap-1`     | 4px                  | 아이콘과 텍스트 사이                     |
| `p-5`       | 20px                 | 피드 카드 상하좌우                       |
| `p-3`       | 12px                 | 3줄 요약 박스 상하좌우                   |
| `px-4 h-8`  | 좌우 16px, 높이 32px | 카테고리 필터                            |
| `px-5 h-11` | 좌우 20px, 높이 44px | CTA 버튼                                 |

필터와 CTA 높이는 고정값입니다. 필터 높이 32px은 일반 버튼의 최소 높이 44px 기준과 구분합니다.

## Radius·그림자

| 토큰               | 클래스            | 값                           | 적용 요소                                      |
| ------------------ | ----------------- | ---------------------------- | ---------------------------------------------- |
| `--radius-pill`    | `rounded-pill`    | 999px                        | 카테고리 필터·카드 내 카테고리 배지            |
| `--radius-card`    | `rounded-card`    | 16px                         | 메인 피드·저장 카드                            |
| `--radius-control` | `rounded-control` | 8px                          | 상단 랭킹 박스·카드 내 CTA 버튼·이슈 요약 영역 |
| `--shadow-card`    | `shadow-card`     | `0 0 8px 0 rgb(0 0 0 / 10%)` | 메인 피드·저장 카드                            |

사용 예: 피드 카드는 `p-5 rounded-card shadow-card`, 요약 영역은 `p-3 rounded-control`, 카테고리 필터는 `px-4 h-8 rounded-pill`, 카드 내 CTA는 `px-5 h-11 rounded-control`을 사용합니다. 필터·카드 등 전용 UI 구현 시 적용하며, 범용 Button·Input·Modal 전체에 동일한 형태를 강제하지 않습니다.

공통 UI: Button, Input은 shared/ui, Modal은 shared/ui/index.client. Button은 기본 type=button이며 폼 제출 시 type=submit 명시. Input은 native input props/ref 전달. Modal은 native dialog로 배경 상호작용 차단, Escape·Tab 순환·초기 입력 포커스·닫힌 후 이전 포커스 복귀 지원.

텍스트는 의미 있는 label, 오류는 aria-invalid/aria-describedby/role=alert 사용. 상태색은 8% 배경 + 20% border. 임의 기본 색상 클래스·정적 inline style 대신 토큰 사용. 버튼 min-height 44px, hover 0.2초, reduced-motion 존중.

Storybook은 MVP 이후 도입. 현재 컴포넌트 동작은 RTL 테스트와 `code temp` 참고 예제로 확인합니다. Modal은 textarea·select·링크도 Tab 순환에 포함합니다. 양수 tabindex는 사용하지 않습니다. 새로운 focusable 요소를 추가하면 Tab 이동 테스트를 함께 갱신합니다.
