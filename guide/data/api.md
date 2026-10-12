# API 경계

공통 HTTP는 shared/api의 `request(url, schema, options)` 사용. fetch 결과는 unknown→Zod→반환 타입. 실패 status는 HttpError의 status에 유지하고 기본 메시지는 `요청 실패 (상태 코드)`입니다. 네트워크/검증 오류는 그대로 reject. 현재 JSON 응답 API 전용이며 204·파일·stream 계약이 필요하면 별도 함수를 추가합니다.

서버는 shared/api/index.server의 serverRequest 사용. 서버 전용 API_BASE_URL로 주소 구성하고 server-only import로 브라우저 유출을 차단합니다. 사용자 cookie·인증 헤더 자동 전달은 현재 없습니다. 인증 도입 시 요청별 검증 후 필요한 헤더만 전달합니다.

entity/api에는 조회 함수·query key/options, feature/api에는 사용자 행동 요청, feature/model에는 mutation·invalidation 정책. 공통 응답 envelope는 백엔드 계약 확정 전 강제하지 않습니다.

데모 계약: GET `/api/demo/items` → `{ id: string, name: string }[]`, PATCH `/api/demo/items/:id` body `{ name: string }` → 수정 항목. 이름은 trim 후 1~40자. 이후 실제 서비스 DTO와 혼합하지 않습니다.

브라우저 호출은 AbortSignal 전달. mutation 실패는 폼에 표시하고 모달 유지. 성공 시 목록 캐시 invalidate 후 닫기. 실제 데이터에서는 서버 캐시 무효화도 별도로 고려합니다.
