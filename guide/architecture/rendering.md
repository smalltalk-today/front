# Server / Client·SSR·SSG

페이지·layout은 Server Component 기본. hook·브라우저 API·이벤트가 필요한 최소 영역만 `use client` 선언. Client Component에서 서버 전용 모듈 import 금지. 서버 entrypoint에는 `server-only`가 있어 빌드 시 차단합니다.

Providers는 children을 받는 Client Component이며, 그 아래 서버에서 전달한 children 자체가 모두 Client Component가 되는 것은 아닙니다. 서버→클라이언트 props는 직렬화 가능해야 합니다.

홈은 요청별 cookie/header 접근 없이 정적 생성합니다. 개인화는 이후 해당 동적 구간에서 수행합니다. metadata는 서버에 정의. SITE_URL은 빌드 시 robots/sitemap에 반영되므로 도메인 변경 시 재빌드합니다. 서버가 단독 소비하는 데이터는 굳이 Query에 넣지 않습니다.

## SSR prefetch 예제

실제 SSR API 도메인 추가 시 entity에 `index.server.ts`를 만들고 `serverRequest` 기반 함수와 스키마를 export합니다. 브라우저 query와 서버 query는 동일 key·DTO 계약을 사용하되 서버 주소·cookie 처리는 서버 함수에만 둡니다.

```ts
// 향후 entity의 api/queries.server.ts
import 'server-only';
import { serverRequest } from '@/shared/api/index.server';
import { demoItemsSchema } from '../model/schema';

export function getDemoItems() {
  return serverRequest('/api/demo/items', demoItemsSchema, { cache: 'no-store' });
}
// index.server.ts에서 getDemoItems를 named export합니다.
```

```tsx
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { createQueryClient } from '@/shared/lib/query';
import { demoItemKeys } from '@/entities/demo-item';
import { getDemoItems } from '@/entities/demo-item/index.server';
import { Demo } from '@/widgets/demo';

// 실제 API를 연결할 때 사용하는 예제. 현재 개발 데모에는 적용하지 않습니다.
export default async function Page() {
  const client = createQueryClient();
  await client.fetchQuery({
    queryKey: demoItemKeys.all,
    queryFn: getDemoItems,
  });
  return (
    <HydrationBoundary state={dehydrate(client)}>
      <Demo />
    </HydrationBoundary>
  );
}
```

위 예제는 향후 실제 API와 entity 서버 entrypoint를 추가한 뒤 사용하는 흐름입니다. 현재 데모는 MSW 브라우저 조회만 사용합니다. route에서는 entity API 함수를 호출하고 직접 HTTP를 작성하지 않습니다. QueryClient를 서버 모듈 전역에 생성하면 사용자 간 캐시가 섞일 수 있습니다. `createQueryClient()`는 항상 새 인스턴스, `getQueryClient()`는 서버에서 새 인스턴스·브라우저에서 재사용. 기본 staleTime 60초로 hydration 직후 중복 조회를 줄입니다.

개인별 응답은 서버 공용 캐시 금지. 공개 조회는 API별로 revalidate/cache 정책을 명시합니다. Next 서버 캐시와 브라우저 Query 캐시는 별개이므로 mutation 시 각각 필요한 무효화를 적용합니다. 인증·요청 cookie는 필요한 서버 조회에만 명시적으로 전달합니다.

[Next.js Server/Client](https://nextjs.org/docs/app/getting-started/server-and-client-components) · [TanStack SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
