import { notFound } from 'next/navigation';
import { getDemoCard } from '@/entities/card';
import { ROUTES } from '@/shared/config';
import { CardsScreen } from '@/widgets/cards/index.client';

export default async function CardDetailPage({ params }: PageProps<typeof ROUTES.cardDetail>) {
  const { id } = await params;
  if (!getDemoCard(id)) notFound();

  return (
    <main
      aria-label="카드 상세"
      className="mx-auto flex min-h-screen max-w-card-page flex-col pb-card-navigation md:pb-8"
    >
      <CardsScreen view="detail" cardId={id} />
    </main>
  );
}
