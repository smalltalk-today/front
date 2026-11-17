'use client';

import { cn } from '../lib/utils';
import { CardIcon } from './card-icon';

interface CardNavigationProps {
  selected: 'feed' | 'saved';
  onNavigate: (target: 'feed' | 'saved') => void;
}

const items = [
  { target: 'feed', label: '투데이 뉴스', activeIcon: 'feed', inactiveIcon: 'feed-inactive' },
  {
    target: 'saved',
    label: '저장',
    activeIcon: 'bookmark-nav',
    inactiveIcon: 'bookmark-nav-inactive',
  },
] as const;

export function CardNavigation({ selected, onNavigate }: CardNavigationProps) {
  return (
    <nav
      aria-label="주요 화면"
      className="fixed inset-x-0 bottom-0 z-40 flex h-card-navigation items-start justify-between border-t-1 border-border-subtle bg-surface-default px-5 pt-1 md:hidden"
    >
      {items.map((item) => (
        <button
          key={item.target}
          type="button"
          aria-current={selected === item.target ? 'page' : undefined}
          className={cn(
            'flex w-card-nav-item flex-col items-center gap-1 px-3 py-1 text-label-11-r whitespace-nowrap',
            selected === item.target ? 'text-content-strong' : 'text-neutral-400',
          )}
          onClick={() => onNavigate(item.target)}
        >
          <CardIcon name={selected === item.target ? item.activeIcon : item.inactiveIcon} />
          {item.label}
        </button>
      ))}
      <button
        type="button"
        disabled
        className="flex w-card-nav-item cursor-not-allowed flex-col items-center gap-1 px-3 py-1 text-label-11-r whitespace-nowrap text-neutral-400"
      >
        <CardIcon name="settings-nav-inactive" />
        설정
      </button>
    </nav>
  );
}
