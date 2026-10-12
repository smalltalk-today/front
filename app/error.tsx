'use client';
import { Button } from '@/shared/ui';
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <h1 className="text-heading font-extrabold">화면을 불러오지 못했습니다.</h1>
      <Button onClick={reset}>다시 시도</Button>
    </main>
  );
}
