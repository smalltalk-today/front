# 로그인 확장

현재 로그인·인증 API·가짜 세션은 없습니다. 향후 entities/user는 프로필 모델/조회, entities/session은 세션 계약, features/sign-in은 로그인 유스케이스 담당. 인증 제공자와 backend 계약은 실제 도입 시 확정합니다.

기본 방향은 서버 검증 + HttpOnly/Secure/SameSite cookie. 토큰을 Zustand·localStorage에 보관하지 않습니다. 사용자 프로필·세션 응답은 TanStack Query, 메뉴·모달 등 UI만 Zustand.

로그인 성공/계정 전환: 기존 사용자 캐시 제거 → 새 세션 확인 → 필요한 사용자 조회. 로그아웃: 서버 세션 폐기 → 사용자별 Query 취소·제거 → ui reset → 공개 경로 이동. 공개 캐시까지 무조건 모두 삭제하지 않고 사용자 관련 key를 관리합니다.

보호된 조회·수정은 서버/백엔드에서 권한 검증. UI 숨김만으로 접근을 차단하지 않습니다. 사용자별 서버 응답은 공유 캐시 금지. cookie 방식 mutation에는 SameSite 정책과 CSRF 방어를 backend와 함께 설계합니다. 로그인 도입 전에 인증 라이브러리·route guard·refresh 추상화부터 생성하지 않습니다.
