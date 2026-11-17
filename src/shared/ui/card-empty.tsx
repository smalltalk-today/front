'use client';

import { Button } from './button/button';

export function CardEmpty({ onExplore }: { onExplore: () => void }) {
  return (
    <section className="flex flex-1 items-center justify-center py-8" aria-label="저장 카드 없음">
      <div className="flex max-w-full flex-col items-center gap-5 text-center">
        <div className="flex h-card-empty-art-height w-card-empty-art-width items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- 원본 SVG의 고유 크기를 유지한다. */}
          <img src="/design/cards/empty-saved.svg" alt="" aria-hidden="true" />
        </div>
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-title-18-sb text-content-strong">아직 저장된 카드가 없어요</h2>
            <p className="text-body-16-r text-content-assistive">
              카드 피드를 둘러보고 대화할 소재를 찾아보세요!
            </p>
          </div>
          <Button variant="secondary" size="XS" className="w-fit self-center" onClick={onExplore}>
            카드 피드 둘러보기
          </Button>
        </div>
      </div>
    </section>
  );
}
