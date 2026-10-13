import Link from 'next/link';
import type { Metadata } from 'next';

// metadata는 Server Component에서 정의합니다.
export const metadata: Metadata = { title: '라우팅 예제' };

export default function ExamplesPage() {
  return (
    <section>
      <h1>라우팅 예제</h1>
      {/* first는 동적 경로 params, tab=details는 queryString으로 전달됩니다. */}
      <Link href="/examples/first?tab=details">동적 페이지 열기</Link>
    </section>
  );
}
