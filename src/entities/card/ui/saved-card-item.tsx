'use client';

import { useId, type MouseEvent } from 'react';
import { ROUTES } from '@/shared/config';
import { Badge, CardIcon } from '@/shared/ui';
import type { Card } from '../model/card';

interface SavedCardItemProps {
  card: Card;
  dateLabel: string;
  onUnsave: (id: string) => void;
  onOpen: (id: string) => void;
}

export function SavedCardItem({ card, dateLabel, onUnsave, onOpen }: SavedCardItemProps) {
  const titleId = useId();
  const detailHref = ROUTES.cardDetail.replace('[id]', encodeURIComponent(card.id));

  function openDetail(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    onOpen(card.id);
  }

  return (
    <article
      aria-labelledby={titleId}
      className="flex w-full flex-col gap-3 rounded-control border-1 border-border-medium bg-surface-default px-4 py-3 text-content-strong"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Badge>{card.category}</Badge>
          <time dateTime={card.publishedAt} className="text-caption-12-r text-content-body">
            {dateLabel}
          </time>
        </div>
        <button
          type="button"
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-control focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label={`${card.title} 저장 해제`}
          onClick={() => onUnsave(card.id)}
        >
          <CardIcon name="bookmark-filled" />
        </button>
      </div>
      <h2 id={titleId} className="text-title-16-m wrap-anywhere md:text-title-18-m">
        <a
          href={detailHref}
          className="block rounded-control focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          onClick={openDetail}
        >
          {card.title}
        </a>
      </h2>
    </article>
  );
}
