# 코드 컨벤션

함수형 컴포넌트, custom hook, 순수 함수 중심. 업무 로직에 class 사용하지 않습니다. 변경 가능한 상태는 해당 상태 도구 안에서만 관리하고 배열/객체는 새 값으로 갱신합니다.

- 컴포넌트·타입: PascalCase. 함수·변수: camelCase. 파일·폴더: kebab-case.
- hook: use 접두어. boolean: is/has/can 접두어 또는 의미가 명확한 상태 이름.
- named export 기본. Next.js 라우트·설정 및 도구 config의 요구는 예외.
- 주석은 코드로 드러나지 않는 이유를 설명. 함수 반환 타입은 외부 계약에서 명시.

ESLint·Prettier 설정이 형식의 기준. 컴포넌트 파일도 이름은 kebab-case (`rename-item-form.tsx`), export는 PascalCase (`RenameItemForm`). `use client`는 파일 최상단.
