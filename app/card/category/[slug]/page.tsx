export default async function CardCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return <div>카드 카테고리 페이지: {slug}</div>;
}
