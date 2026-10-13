'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { clientEnv, isMockEnabled } from '@/shared/config';
import { Button } from '@/shared/ui';

export function MswProvider({ children }: { children: ReactNode }) {
  const enabled = isMockEnabled(process.env.NODE_ENV, clientEnv.appEnv);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    import('./browser')
      .then(({ startMockWorker }) => startMockWorker())
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [enabled, attempt]);

  if (!enabled) return children;
  if (error)
    return (
      <div role="alert" className="panel space-y-4">
        <p className="text-danger">Mock 초기화 실패. 다시 시도하세요.</p>
        <Button
          onClick={() => {
            setError(false);
            setAttempt((value) => value + 1);
          }}
        >
          다시 시도
        </Button>
      </div>
    );
  if (!ready) return <p role="status">Mock 준비 중…</p>;
  return children;
}
