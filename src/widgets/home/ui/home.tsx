import Link from 'next/link';

export function Home() {
  return (
    <>
      <div className="space-y-4">
        <p className="font-semibold text-brand">SMART TALK</p>
        <h1 className="text-display font-extrabold">대화를 시작하는 공간</h1>
        <p className="text-muted">Smart Talk를 준비하고 있습니다.</p>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <Link className="button self-start" href="/dev/demo">
          개발 데모 열기
        </Link>
      )}
    </>
  );
}
