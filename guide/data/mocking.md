# MSW

공통 worker 기반은 `src/_app/mocks`에 보관합니다. 현재 등록된 도메인 handler는 없습니다.

```text
src/_app/mocks/
  handlers.ts       전체 handler 등록: createMockHandlers
  browser.ts        setupWorker·startMockWorker
  index.client.tsx  MswProvider public export
  provider.tsx      개발 환경·worker 준비 후 렌더링
```

새 mock 요청은 `handlers/<domain>/` 아래 요청별 파일에 작성하고 도메인 index에서 조합합니다. 도메인 handler factory를 `handlers.ts`의 `createMockHandlers()`에 등록합니다. 호출마다 fixture를 새로 생성해 브라우저·테스트 상태를 격리합니다.

MswProvider는 앱 Providers에서 모든 페이지를 감싸고 worker 준비를 기다립니다.
`NODE_ENV=development`와 `NEXT_PUBLIC_APP_ENV=develop`일 때만 worker를 dynamic import합니다.
홈에 직접 진입해도 worker가 먼저 준비되며, 초기화 실패는 오류 메시지·재시도 버튼으로 표시합니다.
product에서는 worker를 시작하지 않고 페이지를 바로 렌더링합니다. 환경값 미설정 시 product로 처리합니다.
브라우저 미정의 요청은 bypass, 테스트는 `setupServer`와 `onUnhandledRequest: 'error'`로 누락된 API를 확인합니다.
Server Component의 서버 요청은 브라우저 worker가 가로채지 않습니다.

production 빌드·실행에서는 app 환경값이 develop이어도 worker를 시작하지 않습니다.
별도 `NEXT_PUBLIC_MOCK_ENABLED`는 사용하지 않습니다. 환경변수 변경 후 개발 서버를 재시작합니다.
`public/mockServiceWorker.js`는 생성 파일이므로 직접 수정하지 않습니다. MSW 업데이트 시 `pnpm exec msw init public --save`로 재생성합니다.

[참고 예제](../../code%20temp/README.md)는 MSW 없이 메모리 API로 동작합니다. 실제 제품 API가 확정되면 도메인 fixture와 handler를 추가합니다. API 인증을 mock 결과로 대체하지 않습니다.
