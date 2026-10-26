import { pretendard } from '@/_app/fonts';
import { Providers } from '@/_app/providers';
import '@/_app/styles/globals.css';
import { getServerEnv } from '@/shared/config/index.server';
import type { Metadata } from 'next';

import type { ReactNode } from 'react';

export const metadata: Metadata = {
  metadataBase: new URL(getServerEnv().siteUrl),
  title: { default: 'Smart Talk', template: '%s | Smart Talk' },
  description: 'Smart Talk 서비스',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
