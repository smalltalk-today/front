'use client';

import { toast } from '@/shared/lib/toast';

export function Home() {
  const a = () => toast.success('성공');
  const b = () => toast('인포');
  const c = () => toast.error('실패');
  return (
    <>
      <div className="space-y-4">
        <p className="font-semibold text-brand">SMART TALK</p>
        <h1 className="text-display font-extrabold">대화를 시작하는 공간</h1>
        <p className="text-muted">Smart Talk를 준비하고 있습니다.</p>

        <div className="flex justify-around gap-x-4">
          <button onClick={() => a()}>a</button>
          <button onClick={() => b()}>b</button>
          <button onClick={() => c()}>c</button>
        </div>
      </div>
    </>
  );
}
