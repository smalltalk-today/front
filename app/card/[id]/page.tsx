import { ROUTES } from '@/shared/config';

export default async function CardDetailPage({ params }: PageProps<typeof ROUTES.cardDetail>) {
  const { id } = await params;

  return <div>카드 상세 페이지: {id}</div>;
}
