# 코드 컨벤션

함수형 컴포넌트, custom hook, 순수 함수 중심. 업무 로직에 class 사용하지 않습니다. 변경 가능한 상태는 해당 상태 도구 안에서만 관리하고 배열/객체는 새 값으로 갱신합니다.

- 컴포넌트·타입: PascalCase. 함수·변수: camelCase. 파일·폴더: kebab-case.
- hook: use 접두어. boolean: is/has/can 접두어 또는 의미가 명확한 상태 이름.
- named export 기본. Next.js 라우트·설정 및 도구 config의 요구는 예외.
- `app/**/page.tsx`는 `export default function ...Page()`에서 JSX로 화면을 직접 조합. 페이지 고유 UI·레이아웃은 page, 재사용 영역은 widget. 페이지 전체 re-export는 기본으로 사용하지 않습니다.
- UI는 렌더링·이벤트 연결, model은 상태·검증·업무 로직, api는 통신.
- UI와 `app/**/*.tsx`에서 fetch 직접 호출 금지. 이벤트로 model hook을 호출합니다.
- 비동기 오류는 소비자에게 전달하고 사용자에게 복구 가능한 UI 제공. 빈 catch는 명시적 오류 상태를 다른 경로로 표시할 때만 이유를 주석으로 설명.
- 재사용은 실제 공통 의미가 있을 때 수행. 범용 컴포넌트는 shared/ui 우선 활용.
- 주석은 코드로 드러나지 않는 이유를 설명. 함수 반환 타입은 외부 계약에서 명시.

ESLint·Prettier 설정이 형식의 기준. 컴포넌트 파일도 이름은 kebab-case (`rename-item-form.tsx`), export는 PascalCase (`RenameItemForm`). `use client`는 파일 최상단.
