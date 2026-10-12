# MSW

브라우저 handler는 _app/mocks에 있습니다. MSW는 개발 flag가 true일 때만 dynamic import하고 worker.start 완료 후 데모를 렌더링합니다. 홈에는 MockGate를 씌우지 않습니다. 준비 실패는 오류 메시지로 표시합니다.

```sh
cp .env.example .env.local
pnpm dev
```

/dev/demo에서 실행. 새로고침하면 메모리 fixture 초기화. worker의 미정의 요청은 bypass해 Next.js 자산/개발 요청을 방해하지 않습니다. 테스트는 msw/node의 setupServer와 onUnhandledRequest=error로 미정의 API를 잡습니다. 테스트별 createDemoHandlers로 fixture 격리.

production에는 `/dev/demo`가 404이며 flag가 true여도 worker를 시작하지 않습니다. 개발에 등록한 service worker는 개발 종료 시 deactivate되며 브라우저의 Application > Service Workers에서 수동 해제할 수도 있습니다. mockServiceWorker.js는 생성 파일이므로 직접 수정하지 않습니다. MSW 업데이트 시 `pnpm exec msw init public --save`로 재생성합니다.

실제 Mock API 서버·DB는 없습니다. 제품 API가 확정되면 해당 도메인 fixture와 handler를 추가합니다. API 인증을 mock 결과로 대체하지 않습니다.
