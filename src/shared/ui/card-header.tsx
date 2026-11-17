'use client';

import { CardIcon } from './card-icon';
import { CardLogo } from './card-logo';
import { Button } from './button/button';

interface CardHeaderProps {
  view: 'feed' | 'saved' | 'detail';
  onNavigate: (target: 'feed' | 'saved') => void;
}

export function CardHeader({ view, onNavigate }: CardHeaderProps) {
  return (
    <header className="bg-surface-default text-content-strong">
      <div className="flex h-card-header items-center px-4 md:hidden">
        {view === 'feed' ? (
          <button type="button" aria-label="카드 피드로 이동" onClick={() => onNavigate('feed')}>
            <CardLogo />
          </button>
        ) : view === 'saved' ? (
          <h1 className="text-headline-20-sb">저장됨</h1>
        ) : (
          <button
            type="button"
            aria-label="저장 목록으로 돌아가기"
            onClick={() => onNavigate('saved')}
          >
            <CardIcon name="back" />
          </button>
        )}
      </div>
      <div className="hidden h-card-header items-center justify-between gap-4 md:flex">
        <button type="button" aria-label="카드 피드로 이동" onClick={() => onNavigate('feed')}>
          <CardLogo />
        </button>
        {view !== 'feed' && (
          <div className="xl:hidden">
            <Button variant="icon" aria-label="카드 피드로 닫기" onClick={() => onNavigate('feed')}>
              {/* eslint-disable-next-line @next/next/no-img-element -- Figma 원본 SVG를 사용한다. */}
              <img src="/design/close-l.svg" alt="" aria-hidden="true" />
            </Button>
          </div>
        )}
        <div
          className={
            view === 'feed' ? 'flex items-center gap-2' : 'hidden items-center gap-2 xl:flex'
          }
        >
          <button
            type="button"
            aria-label="저장 목록"
            aria-current={view === 'saved' ? 'page' : undefined}
            className="flex items-center gap-2 rounded-control border-1 border-border-medium px-3 py-1 text-caption-12-r"
            onClick={() => onNavigate('saved')}
          >
            <CardIcon name="bookmark-top" />
            저장됨
          </button>
          <button
            type="button"
            disabled
            className="flex cursor-not-allowed items-center gap-2 rounded-control border-1 border-border-medium px-3 py-1 text-caption-12-r text-content-assistive"
          >
            <CardIcon name="settings" />
            설정
          </button>
        </div>
      </div>
      {view === 'detail' && (
        <div className="hidden h-card-header items-center md:flex xl:hidden">
          <button
            type="button"
            aria-label="저장 목록으로 돌아가기"
            onClick={() => onNavigate('saved')}
          >
            <CardIcon name="back" />
          </button>
        </div>
      )}
      {view === 'saved' && (
        <div className="mt-5 hidden h-card-header items-center md:flex">
          <h1 className="text-headline-22-sb">저장됨</h1>
        </div>
      )}
    </header>
  );
}
