# 상태 소유권

| 상태                            | 담당             |
| ------------------------------- | ---------------- |
| API 데이터·프로필·세션 조회     | TanStack Query   |
| 모달·사이드바·페이지 간 임시 UI | Zustand          |
| 입력값·폼 검증·제출             | React Hook Form  |
| 컴포넌트 내부 선택·표시         | useState         |
| 서버에서만 소비하는 데이터      | Server Component |

서버 데이터를 Zustand에 복제하지 않습니다. 로그인 사용자 데이터는 Query, 사용자 메뉴가 열려 있는지는 Zustand. 여러 페이지가 공유하지 않는 선택 항목은 지역 상태로 유지합니다.

## Zustand 사용 원칙

현재 앱에는 Zustand store와 Provider가 없습니다. 사용처가 없던 `UiStoreProvider`와 모달 store는 삭제했습니다. 여러 컴포넌트·페이지에서 UI 상태를 공유해야 하는 실제 요구가 생길 때 추가합니다. 모달·메뉴 상태도 한 컴포넌트에서만 사용한다면 `useState`로 관리합니다.

[공식 입문 문서](https://zustand.docs.pmnd.rs/learn/getting-started/introduction.html)는 `create()`로 store hook을 만들며 Provider가 필요 없습니다. [공식 Next.js 가이드](https://zustand.docs.pmnd.rs/learn/guides/nextjs.html)는 SSR 요청 간 상태 공유를 방지하기 위해 `createStore()` factory와 Context Provider를 사용합니다.

이 프로젝트에 store를 추가할 때는 Next.js 가이드에 따라 Provider 인스턴스별로 생성하고, selector로 필요한 값만 구독합니다. Provider는 상태를 공유해야 하는 범위에 배치합니다. 서버 요청 간 singleton 공유 및 Server Component의 store 읽기·쓰기를 금지합니다. persist는 저장 요구가 있을 때만 추가합니다.

## Query 기본 정책

Query 기본 staleTime 60초, 조회 retry 1회, mutation retry 없음. 실제 API의 비용·멱등성·실패 특성에 맞춰 도메인별 override. mutation 성공 시 관련 key invalidate. 개인정보 캐시는 로그인 사용자 변경/로그아웃 때 제거합니다.
