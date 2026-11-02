'use client';

import { toast } from '@/shared/lib/toast';

export function Home() {
  const a = () => toast.success('성공', { duration: 20000 });
  const b = () => toast('인포', { duration: 20000 });
  const c = () =>
    toast.error(
      '실패Smart Talk를 준비하고 있습니다.Smart Talk를 준비하고 있습니다.Smart Talk를 준비하고 있습니다.Smart Talk를 준비하고 있습니다.Smart Talk를 준비하고 있습니다.Smart Talk를 준비하고 있습니다.Smart Talk를 준비하고 있습니다.',
      { duration: 3000 },
    );
  return (
    <>
      <div className="space-y-4">
        <p className="text-brand font-semibold">SMART TALK</p>
        <h1 className="text-display font-extrabold">대화를 시작하는 공간</h1>
        <p className="text-muted">Smart Talk를 준비하고 있습니다.</p>

        <div className="flex justify-around gap-x-4">
          <button className="p-6" onClick={() => a()}>
            a
          </button>
          <button className="p-6" onClick={() => b()}>
            b
          </button>
          <button className="p-6" onClick={() => c()}>
            c
          </button>
        </div>
      </div>
    </>
  );
}
