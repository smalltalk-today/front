'use client';

import { useId } from 'react';
import { CardIcon } from './card-icon';

interface CardRankingProps {
  items: readonly { id: string; title: string }[];
  onSelect: (id: string) => void;
}

export function CardRanking({ items, onSelect }: CardRankingProps) {
  const titleId = useId();
  const visible = items.slice(0, 10);

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-card border-1 border-border-subtle bg-surface-default p-5 text-content-strong"
    >
      <h2 id={titleId} className="flex items-center gap-2 text-headline-18-sb">
        <CardIcon name="crown" />
        오늘 대화 소재{visible.length > 0 ? ` TOP ${visible.length}` : ''}
      </h2>
      <p className="mt-2 mb-3 text-body-14-r text-content-assistive">
        오늘 이슈 중 얘기하기 좋은 것만 모았어요.
      </p>
      <ol className="flex list-none flex-col">
        {visible.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              aria-label={`${index + 1}위 ${item.title}`}
              className="flex h-12 w-full items-center gap-2 text-left text-title-16-m"
              onClick={() => onSelect(item.id)}
            >
              <span className="shrink-0 text-label-16-sb text-brand-primary">{index + 1}</span>
              <span className="min-w-0 truncate">{item.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
