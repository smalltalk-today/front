export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <div>카드 상세 페이지: {id}</div>;
}
