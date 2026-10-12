# 개발 가이드

추천 순서: 프로젝트 실행 → FSD → 코드·타입 규칙 → 렌더링·상태 → API → 도메인.

| 분야     | 문서                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 프로젝트 | [실행](project/setup.md), [환경변수](project/environment.md), [셋업 계획](project/setup-plan.md)                               |
| 아키텍처 | [FSD](architecture/fsd.md), [Server / Client·SSR](architecture/rendering.md)                                                   |
| 컨벤션   | [코드](conventions/code.md), [타입](conventions/types.md)                                                                      |
| 데이터   | [상태 소유권](data/state.md), [API](data/api.md), [MSW](data/mocking.md)                                                       |
| 인증     | [로그인 확장](auth/extension.md)                                                                                               |
| UI       | [디자인 시스템](ui/design-system.md)                                                                                           |
| 운영     | [Git](workflow/git.md), [Projects·이슈](workflow/projects.md), [pnpm 사용·협업](workflow/pnpm.md), [품질](workflow/quality.md) |
| 도메인   | [검증 데모](domains/demo.md)                                                                                                   |

신규 도메인은 `domains/<domain>.md`에 목적, 모델, API, 상태 소유권, 사용자 흐름, 실패 처리, 검증 방법을 기록하고 이 목차에 링크합니다. 구조·계약 변경 PR은 관련 가이드를 함께 갱신합니다. 개발 문서는 모두 이 폴더에 보관합니다.
