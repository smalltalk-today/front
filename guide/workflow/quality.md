# 품질 검증

| 명령                       | 역할                                   |
| -------------------------- | -------------------------------------- |
| pnpm check                 | lint·format·typecheck·테스트 통합 검사 |
| pnpm lint                  | Next.js·TypeScript·FSD 규칙            |
| pnpm format / format:check | Prettier 작성 / 검사                   |
| pnpm typecheck             | Next 타입 생성 + strict 검사           |
| pnpm test / test:run       | Vitest watch / 단일 실행               |
| pnpm build / start         | production 빌드 / 실행                 |

pre-commit은 staged 파일만 ESLint --fix와 Prettier 적용. 전체 검증은 CI 수행. `pnpm check`는 로컬 기본 검사 명령이며 production build와 서버 경계 검사는 별도 실행합니다. Quality workflow는 동일 PR/브랜치의 새 실행이 시작되면 이전 실행을 취소합니다. PR Convention workflow는 제목 편집 시에도 다시 실행합니다. CI는 Node 22, pnpm packageManager 버전, frozen lockfile 사용. 예제 SITE_URL은 CI용이며 실제 배포 주소로 교체해야 합니다.

기반 테스트는 외부 JSON·HTTP status·환경값·production mock 차단·store/cache 격리. 참고 예제 테스트는 폼 검증·등록 후 캐시 갱신·저장 실패 시 입력 유지·store 격리를 확인합니다. 모달 테스트는 키보드 동작과 포커스 복귀를 확인합니다. FSD 테스트는 위/동일 레이어 및 deep import 차단과 정상 public import를 확인합니다.

새 로직은 실패 테스트 먼저 작성하고 구현 후 통과 확인. 생성 파일·단순 스타일은 불필요한 구현 복제 테스트를 추가하지 않습니다. jsdom dialog 보완은 테스트 환경에서만 적용하며 실제 브라우저 키보드 동작도 검증합니다.

production 수동 점검: 홈 200, metadata·robots·sitemap URL, mock worker 요청/등록 없음. 서버 모듈 client import는 임시 테스트 라우트에서 build 실패 확인 후 파일 제거하고 정상 재빌드합니다.

`app/**/*.tsx`도 직접 fetch 금지 규칙 적용 대상입니다. API 구현은 api segment, 서버 페이지는 entity API 호출과 화면 조합을 담당합니다. 브랜치·PR 제목 검증기는 node 기반이라 추가 패키지 설치 없이 CI에서 실행됩니다.

dev·main에는 `quality`, `pr-conventions`를 필수로 설정합니다. main에는 같은 저장소의 dev 출발을 확인하는 `main-source`도 필수입니다. 출발 검사 테스트는 잘못된 대상·작업 브랜치의 main 직행·fork의 dev·필수 정보 누락을 차단하고, 실제 검사 스크립트가 같은 head SHA의 정상·작업 브랜치·fork PR을 각각 판정하며, 토큰이나 commit status API 호출 없이 종료 코드로 결과를 반환하는지 확인합니다. [Git·PR 가이드](git.md)에 병합 흐름과 검사 활성화 순서를 설명합니다.
