import Link from 'next/link';
import type { ReactNode } from 'react';

// examples 아래 페이지를 감싸는 공통 레이아웃입니다. children에 선택된 page가 들어옵니다.
export default function ExamplesLayout({ children }: { children: ReactNode }) {
  return (
    <main>
      <nav aria-label="예제 탐색">
        <Link href="/examples">예제 목록</Link>
      </nav>
      {children}
    </main>
  );
}
