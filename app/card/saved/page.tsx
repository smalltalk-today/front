import { CardsScreen } from '@/widgets/cards/index.client';

export const metadata = { title: { absolute: '저장됨 | Smalltalk Today' } };

export default function SavedCardPage() {
  return (
    <main
      aria-label="저장 카드"
      className="mx-auto flex min-h-screen max-w-card-page flex-col pb-card-navigation md:pb-8"
    >
      <CardsScreen view="saved" />
    </main>
  );
}
