# 검증 데모 도메인

제품 기능이 아닌 기반 연결 검증용. 개발 환경 `/dev/demo`에서만 접근합니다.

모델: DemoItem `{ id: string, name: string }`, 외부 DTO와 별도 계약. 초기 fixture는 id=1, name=첫 번째 항목. 폼은 trim 후 1~40자 이름을 허용합니다.

흐름: worker 준비 → Query GET 조회 → 항목 선택 → Zustand modalOpen → RHF 입력/검증 → PATCH mutation → 목록 invalidate → 모달 닫기·focus 복귀.

Query key는 ['demo-items']. 데이터는 entity, 이름 수정은 feature, 조합은 widget, 전역 초기화는 _app. 선택한 항목은 widget 지역 상태, 모달 열림만 Zustand. mock 메모리는 worker/test handler 생성 시 초기화하며 영구 저장하지 않습니다.

조회 실패는 재시도 버튼, 빈 목록은 안내문, 수정 실패는 입력과 모달 유지. 제출 중 저장 버튼 비활성화. production은 페이지를 404로 처리. 실제 도메인 추가 시 이 데모 계약을 서비스 API로 재사용하지 않습니다.
