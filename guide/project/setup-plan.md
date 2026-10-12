# 초기 셋업 계획·구현 기록

목표: Next.js 16.4.0, 함수형 TypeScript strict, FSD 기반의 실행 가능한 단일 앱. 로그인·Storybook·실제 제품 기능·배포는 후속 작업입니다. 초기 셋업은 smalltalk-today/front 저장소에 이슈와 PR로 게시합니다.

1. Next.js App Router, React, Tailwind 4, exact 의존성·lockfile 구성.
2. `_app → widgets → features → entities → shared` 레이어와 public API 규칙 구성. `_pages` 레이어는 사용자 결정에 따라 사용하지 않습니다. 라우트 화면은 app/page.tsx의 default export 함수에서 JSX로 직접 조합하고, 재사용 조합은 widgets 담당. 페이지 전체 re-export는 기본으로 사용하지 않습니다.
3. HTTP·환경 검증, 요청별 서버 QueryClient, 브라우저 QueryClient 재사용, provider별 Zustand store 구성.
4. MSW 목록 조회·이름 수정, RHF 검증, mutation 후 캐시 갱신, 모달 데모 구성.
5. guide 문서, GitHub 템플릿·CI, Husky·lint-staged 구성.
6. lint·format·typecheck·test·build와 production 홈·데모 차단 검증.

구현 판단: 빈 폴더라 현재 작업 경로에 Git을 초기화하고 feat/project-setup 브랜치 사용. 모든 개발 문서는 guide에 위치. API envelope·인증 공급자는 미리 정의하지 않습니다. mock은 데모 경로에 한정하고 홈 렌더링은 가로막지 않습니다.

테스트는 HTTP 경계, 환경변수, store/cache 격리, FSD import, 데모 상태 전환, 모달 키보드·복귀를 대상으로 합니다. SSR prefetch/hydration 사용법은 rendering 문서에 제공하며 실제 서비스 SSR API 연결은 도메인 추가 시 적용합니다.

## 완료 검증 — 2026-10-12

- frozen-lockfile 설치, lint, format:check, typecheck 통과.
- Vitest 5개 파일, 테스트 12개 통과. SSR 요청별 QueryClient와 hydration 후 fresh cache 재사용 포함.
- server-only 모듈의 Client Component import는 production build에서 실패함을 확인.
- production build 통과. 홈·robots·sitemap 정적 생성 확인.
- mock flag=true로 빌드한 production에서 홈 200, 데모 404, worker 등록 0건·요청 0건 확인.
- 실제 Chromium에서 조회·이름 수정·캐시 갱신·Tab 순환·Escape·focus 복귀 확인.
- 최종 코드 검토에서 발견한 Modal textarea/select/link focus 누락을 재현 테스트 후 수정.
- 검증용 서버·브라우저 종료. 개발 실행은 pnpm dev.
