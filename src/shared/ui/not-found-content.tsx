import Link from 'next/link';
import { ROUTES } from '@/shared/config';
import { cn } from '@/shared/lib/utils';
import { buttonVariants } from './button/button.style';

export function NotFoundContent() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-default px-4 text-center">
      <div className="flex max-w-full flex-col items-center gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- 원본 SVG의 고유 크기를 유지한다. */}
        <img src="/design/not-found/map.svg" alt="" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <h1 className="text-title-18-sb text-content-strong">페이지를 찾을 수 없어요</h1>
          <p className="text-body-16-r text-content-assistive">
            주소가 잘못되었거나
            <br />
            페이지가 이동했을 수 있어요.
          </p>
        </div>
        <Link
          href={ROUTES.home}
          className={cn(buttonVariants({ variant: 'secondary', size: 'XS' }), 'w-auto')}
        >
          홈 화면으로 이동
        </Link>
      </div>
    </main>
  );
}
