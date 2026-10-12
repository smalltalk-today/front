// 서버 searchParams는 object입니다. 중복 key는 string[], 누락된 key는 undefined입니다.
export type RouteSearch = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// URL은 외부 입력: 중복 key, 잘못된 숫자, 알 수 없는 tab을 정규화합니다.
export function parseRouteSearch(input: RouteSearch) {
  const page = Number(first(input.page));
  return {
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    tab: first(input.tab) === 'details' ? 'details' : 'overview',
    q: (first(input.q) ?? '').trim().slice(0, 100),
  };
}

// 기존 query를 복사하므로 수정하지 않은 key와 중복 값은 보존됩니다.
// URLSearchParams가 인코딩을 맡고 null/빈 문자열은 해당 key 삭제를 뜻합니다.
export function updateQueryString(current: string, changes: Record<string, string | null>) {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
  }
  return next.toString();
}
