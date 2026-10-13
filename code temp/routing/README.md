# Params·Query String·Props·CSR·SSR

## URL과 값의 출처

예: `/examples/first?tab=details&page=2&q=hello&tag=a&tag=b`

| 값                   | 서버 page                     | Client Component                     |
| -------------------- | ----------------------------- | ------------------------------------ |
| 경로의 `first`       | `(await params).slug`         | `useParams<{ slug: string }>().slug` |
| `tab`, `page`, `q`   | `await searchParams`의 object | `useSearchParams().get('q')`         |
| 중복 `tag`           | `searchParams.tag`의 string[] | `useSearchParams().getAll('tag')`    |
| 일반 `heading` props | 부모가 직접 계산해 전달       | 함수 인자에서 구조 분해              |

Next.js가 params/searchParams를 자동 전달하는 대상은 route page입니다. 일반 컴포넌트는 부모가 props로 넘기거나 Client hook으로 읽어야 합니다. 동적 폴더명 `[slug]`가 key 이름을 결정합니다. `[id]`라면 params.id입니다. `[...slug]` 같은 catch-all은 string[]입니다.

## 서버에서 읽고 props로 전달

`app/examples/[slug]/page.tsx`는 Promise인 params/searchParams를 await합니다. `parseRouteSearch`는 중복 key의 첫 값, page의 양의 정수 여부, tab 허용값, q의 공백/길이를 처리합니다. URL 값은 문자열이므로 숫자 필드도 직접 변환·검증해야 합니다.

```tsx
const { slug } = await params;
const search = parseRouteSearch(await searchParams);
<RouteClient heading={`서버에서 계산한 제목: ${slug}`} />;
```

RouteClient의 heading은 일반 props입니다. id·heading·JSON object 같은 직렬화 가능한 값은 서버→클라이언트로 전달할 수 있습니다. DB 연결, QueryClient 인스턴스, 일반 함수는 전달하지 않습니다. 서버 전용 조회 모듈은 `server-only`로 보호합니다.

## 클라이언트에서 읽고 URL 수정

`_components/route-client.tsx`는 useParams/useSearchParams/usePathname/useRouter를 사용합니다. useSearchParams는 읽기 전용입니다. 기존 query를 `new URLSearchParams(searchParams.toString())`로 복제하고 수정한 뒤 router.replace로 이동합니다.

`updateQueryString`은 지정한 key만 수정합니다. 다른 query와 중복 tag는 보존합니다. null 또는 빈 문자열은 key를 삭제합니다. pathname을 사용하므로 현재 CSR/상세 페이지 경로를 유지합니다. URLSearchParams가 한글·공백·특수문자를 인코딩하므로 문자열을 직접 연결해 query 값을 만들지 않습니다.

replace는 현재 history를 교체하고 push는 새 history를 추가합니다. 필터 수정처럼 뒤로가기 기록이 과도해질 수 있는 변화에는 replace, 새 화면 이동에는 Link/push를 사용합니다. Link의 object href도 가능합니다:

```tsx
<Link href={{ pathname: '/examples/first', query: { q: '안녕', page: '2' } }}>검색 결과</Link>
```

정적 화면에서 useSearchParams를 사용하는 영역은 Suspense로 감쌉니다. 예제 CSR page도 이 경계를 포함합니다. 개발 모드만 확인하면 production의 Suspense 누락을 놓칠 수 있습니다. layout에는 searchParams가 자동 전달되지 않으므로 최신 query는 page 또는 Client hook에서 읽습니다.

## 렌더링·조회 방식 비교

| URL                      | 데이터 조회 시점              | 데이터 사용 방법                                                     |
| ------------------------ | ----------------------------- | -------------------------------------------------------------------- |
| `/examples/first/csr`    | 브라우저에서 useQuery 실행    | useParams → queryOptions → API Route                                 |
| `/examples/first/server` | 요청 시 서버                  | params/searchParams → 서버 조회 → JSX                                |
| `/examples/first/ssr`    | 서버 최초 조회, 이후 브라우저 | queryOptions → fetchQuery → dehydrate → HydrationBoundary → useQuery |

`'use client'`는 hook/이벤트 사용 경계입니다. Client Component도 최초 로딩에서는 서버에서 HTML을 생성할 수 있으므로 이 선언만으로 순수 CSR이 되지는 않습니다. CSR 예제는 **데이터를 서버에서 미리 조회하지 않고 useQuery가 브라우저에서 요청하는 방식**을 뜻합니다. 초기 HTML에는 제목·로딩 UI가 포함될 수 있습니다.

서버 직접 조회 예제는 Query가 필요 없는 서버 전용 데이터를 JSX에 사용합니다. SSR Query 예제는 같은 데이터를 클라이언트에서 계속 재조회해야 할 때 서버 결과를 Query 캐시로 넘깁니다. SSR page의 connection()은 실제 요청 후 실행을 명시합니다. 단순 Server Component는 별도 정책이 없으면 빌드 시 정적 생성될 수도 있습니다.

## 복사해 실행

1. `routing/app/examples`를 실제 `app/examples`로 복사합니다. `_components`, `_lib`도 함께 복사합니다.
2. `routing/app/api/example-products`를 실제 `app/api/example-products`로 복사합니다.
3. 기존 루트 Providers의 QueryClientProvider를 유지합니다.
4. `/examples/first`, `/examples/second`와 위 CSR/server/ssr URL을 확인합니다.

현재 파일은 참고 폴더에만 있어 URL을 등록하지 않습니다. 서버 데이터는 first/second fixture이며 실제 DB가 아닙니다. 코드 위치를 바꿀 때 상대 import도 맞춰야 합니다. `navigation.tsx`는 원하는 Client 화면에 별도로 연결합니다.

[Next.js params/searchParams](https://nextjs.org/docs/app/api-reference/file-conventions/page) · [useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params) · [connection](https://nextjs.org/docs/app/api-reference/functions/connection)
