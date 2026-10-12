'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { clientEnv, isMockEnabled } from '@/shared/config';

export function MockGate({ children }: { children: ReactNode }) {
  const enabled = isMockEnabled(process.env.NODE_ENV, clientEnv.mockEnabled);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    import('./browser')
      .then(({ startMockWorker }) => startMockWorker())
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        if (active) setError('Mock 초기화 실패. 새로고침 후 다시 시도하세요.');
      });
    return () => {
      active = false;
    };
  }, [enabled]);
  if (!enabled)
    return <p role="alert">데모 실행에는 NEXT_PUBLIC_MOCK_ENABLED=true 설정이 필요합니다.</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!ready) return <p role="status">개발 데모 준비 중…</p>;
  return children;
}
