import { CardsScreen } from '@/widgets/cards/index.client';
import { CardSettings } from '@/widgets/setting-list/index.client';
import { version } from '../../../package.json';

export const metadata = { title: { absolute: '설정 | Smalltalk Today' } };

export default function CardSettingsPage() {
  return (
    <main
      aria-label="설정"
      className="mx-auto flex min-h-screen max-w-card-page flex-col pb-card-navigation md:pb-8"
    >
      <CardsScreen view="settings">
        <CardSettings version={version} />
      </CardsScreen>
    </main>
  );
}
