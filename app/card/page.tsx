import { CardsScreen } from '@/widgets/cards/index.client';

export default function CardPage() {
  return (
    <main
      aria-label="투데이 뉴스"
      className="mx-auto flex min-h-screen max-w-card-page flex-col pb-card-navigation md:pb-8"
    >
      <CardsScreen view="feed" />
    </main>
  );
}
