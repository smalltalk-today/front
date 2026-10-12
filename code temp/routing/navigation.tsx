'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/shared/ui';

// Client 이벤트에서 이동할 때 useRouter를 사용합니다. 단순 링크는 Link가 적합합니다.
export function NavigationExample() {
  const router = useRouter();
  // pathname에는 queryString이 포함되지 않습니다. query 값은 useSearchParams로 읽습니다.
  const pathname = usePathname();
  return (
    <div>
      <p>현재 경로: {pathname}</p>
      <Button onClick={() => router.push('/examples')}>목록으로 이동</Button>
    </div>
  );
}
