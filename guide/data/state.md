# 상태 소유권

| 상태                            | 담당             |
| ------------------------------- | ---------------- |
| API 데이터·프로필·세션 조회     | TanStack Query   |
| 모달·사이드바·페이지 간 임시 UI | Zustand          |
| 입력값·폼 검증·제출             | React Hook Form  |
| 컴포넌트 내부 선택·표시         | useState         |
| 서버에서만 소비하는 데이터      | Server Component |

서버 데이터를 Zustand에 복제하지 않습니다. 로그인 사용자 데이터는 Query, 사용자 메뉴가 열려 있는지는 Zustand. 여러 페이지가 공유하지 않는 선택 항목은 지역 상태로 유지합니다.

현재 UiState는 modalOpen/openModal/closeModal/reset. provider마다 createUiStore로 생성하고 selector로 필요한 값만 구독합니다. 서버 요청 간 singleton 금지. persist 미사용. 이후 sidebar 등 실제 요구가 생기면 같은 UI 계약을 확장하거나 별도 store로 분리합니다.

Query 기본 staleTime 60초, 조회 retry 1회, mutation retry 없음. 실제 API의 비용·멱등성·실패 특성에 맞춰 도메인별 override. mutation 성공 시 관련 key invalidate. 개인정보 캐시는 로그인 사용자 변경/로그아웃 때 제거합니다.
