# 타입 컨벤션

TypeScript strict + noUncheckedIndexedAccess. 객체 계약은 interface, union·조합·추론은 type. 전역 타입 파일/선언 병합으로 도메인을 확장하지 않습니다.

```ts
interface User {
  id: string;
  displayName: string;
}
interface UserProfile extends User {
  avatarUrl: string | null;
}
type SessionState = 'anonymous' | 'authenticated';
```

위 타입은 향후 예시이며 현재 인증 모델을 확정하지 않습니다. 타입은 해당 도메인 model에 정의하고 public API에서 `export type`으로 공개합니다. 필요한 구체적 필드만 추가하며 막연한 확장을 위한 index signature·과도한 generic은 만들지 않습니다.

외부 DTO, 도메인 모델, 폼 입력은 목적별 분리. DTO→모델 변환은 API 경계, 폼→요청 변환은 feature에서 수행. 동일 필드여도 계약 역할을 구분합니다. 변경 가능한 DTO와 도메인 모델이 우연히 함께 바뀌지 않도록 합니다.

외부 JSON은 unknown으로 받고 Zod 스키마 검증 후 사용. any 금지, 근거 없는 as 단언 금지. nullable와 optional은 별개: null은 명시적 빈 값, optional은 필드 부재. 유효성 검증을 타입 단언으로 대체하지 않습니다.
