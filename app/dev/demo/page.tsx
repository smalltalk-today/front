import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MockGate } from '@/_app/mocks/index.client';
import { Demo } from '@/widgets/demo';

export const metadata: Metadata = { title: '개발 데모', robots: { index: false, follow: false } };
export default function DemoPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="space-y-3">
        <h1 className="text-heading font-extrabold">개발 데모</h1>
        <p className="text-muted">항목을 조회하고 이름을 수정할 수 있습니다.</p>
      </header>
      <MockGate>
        <Demo />
      </MockGate>
    </main>
  );
}
