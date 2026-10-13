# 공통 UI·토큰

Tailwind CSS 4의 @theme와 _app/styles/globals.css가 기준. canvas/surface/ink/muted/brand/line/danger 색상, spacing 4px, card radius 16px, control radius 10px, heading/display clamp 크기를 사용합니다. Noto Sans KR을 로컬 번들로 제공해 빌드 시 외부 폰트 요청이 없습니다.

공통 UI: Button, Input은 shared/ui, Modal은 shared/ui/index.client. Button은 기본 type=button이며 폼 제출 시 type=submit 명시. Input은 native input props/ref 전달. Modal은 native dialog로 배경 상호작용 차단, Escape·Tab 순환·초기 입력 포커스·닫힌 후 이전 포커스 복귀 지원.

텍스트는 의미 있는 label, 오류는 aria-invalid/aria-describedby/role=alert 사용. 상태색은 8% 배경 + 20% border. 임의 기본 색상 클래스·정적 inline style 대신 토큰 사용. 버튼 min-height 44px, hover 0.2초, reduced-motion 존중.

Storybook은 MVP 이후 도입. 현재 컴포넌트 동작은 RTL 테스트와 `code temp` 참고 예제로 확인합니다. Modal은 textarea·select·링크도 Tab 순환에 포함합니다. 양수 tabindex는 사용하지 않습니다. 새로운 focusable 요소를 추가하면 Tab 이동 테스트를 함께 갱신합니다.
