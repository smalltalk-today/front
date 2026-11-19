'use client';

import { CardIcon } from './card-icon';
import { CardLogo } from './card-logo';
import { Button } from './button/button';
import { AppBar } from './app-bar';
import type { CardDestination } from './card-navigation';

interface CardHeaderProps {
  view: CardDestination | 'detail';
  onNavigate: (target: CardDestination) => void;
}

export function CardHeader({ view, onNavigate }: CardHeaderProps) {
  return (
    <header className="bg-surface-default text-content-strong">
      <div className="md:hidden">
        <AppBar
          leftAction={
            view === 'feed'
              ? { label: '카드 피드로 이동', icon: <CardLogo />, onClick: () => onNavigate('feed') }
              : view === 'detail'
                ? {
                    label: '저장 목록으로 돌아가기',
                    icon: <CardIcon name="back" />,
                    onClick: () => onNavigate('saved'),
                  }
                : undefined
          }
        >
          {view === 'saved' && <h1 className="text-headline-20-sb">저장됨</h1>}
          {view === 'settings' && <h1 className="text-headline-20-sb">설정</h1>}
        </AppBar>
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
            aria-current={view === 'settings' ? 'page' : undefined}
            className="flex items-center gap-2 rounded-control border-1 border-border-medium px-3 py-1 text-caption-12-r"
            onClick={() => onNavigate('settings')}
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
      {(view === 'saved' || view === 'settings') && (
        <div className="hidden h-card-header items-center md:flex xl:mt-5">
          <h1 className="text-headline-22-sb">{view === 'settings' ? '설정' : '저장됨'}</h1>
        </div>
      )}
    </header>
  );
}
