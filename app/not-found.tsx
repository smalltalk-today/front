import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <h1 className="text-heading font-extrabold">페이지를 찾을 수 없습니다.</h1>
      <Link href="/" className="button">
        홈으로
      </Link>
    </main>
  );
}
