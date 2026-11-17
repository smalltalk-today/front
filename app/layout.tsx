import { pretendard } from '@/_app/fonts';
import { Providers } from '@/_app/providers';
import '@/_app/styles/globals.css';
import { getServerEnv } from '@/shared/config/index.server';
import type { Metadata } from 'next';

import type { ReactNode } from 'react';

export const metadata: Metadata = {
  metadataBase: new URL(getServerEnv().siteUrl),
  title: {
    default: 'Smalltalk Today · 오늘 뉴스, 대화로 바로 쓰세요',
    template: '%s | Smalltalk Today',
  },
  description:
    '오늘의 화제 이슈를 3줄 요약과 바로 쓸 수 있는 스몰토크 문장으로. 출근 전 30초면 점심 대화 준비 끝.',
  openGraph: {
    title: 'Smalltalk Today · 오늘 뉴스, 대화로 바로 쓰세요',
    description: '오늘의 화제 이슈를 3줄 요약과 바로 쓸 수 있는 스몰토크 문장으로.',
    siteName: 'Smalltalk Today',
  },
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
