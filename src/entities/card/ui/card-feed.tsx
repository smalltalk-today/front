'use client';

import { useId } from 'react';
import { Badge, Button, CardIcon } from '@/shared/ui';
import type { Card } from '../model/card';
import { ArticleSummary } from './article-summary';

interface CardFeedProps {
  card: Card;
  sentence: string;
  sentenceIndex: number;
  dateLabel: string;
  saved: boolean;
  onSave: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
  summaryExpanded: boolean;
  onSummaryToggle: () => void;
  regenerating?: boolean;
  regenerationDisabled?: boolean;
}

export function CardFeed({
  card,
  sentence,
  sentenceIndex,
  dateLabel,
  saved,
  onSave,
  onCopy,
  onRegenerate,
  summaryExpanded,
  onSummaryToggle,
  regenerating = false,
  regenerationDisabled = false,
}: CardFeedProps) {
  const titleId = useId();
  const iconButtonStyle =
    'flex shrink-0 cursor-pointer items-center justify-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed';

  return (
    <article
      id={`card-${card.id}`}
      aria-labelledby={titleId}
      className="w-full overflow-hidden rounded-card bg-surface-default text-content-strong shadow-card"
    >
      <div className="flex flex-col gap-3 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Badge>{card.category}</Badge>
            <time
              dateTime={card.publishedAt}
              className="text-caption-12-r text-content-strong sm:text-caption-14-r"
            >
              {dateLabel}
            </time>
          </div>
          <button
            type="button"
            className={iconButtonStyle}
            aria-pressed={saved}
            aria-label={`${card.title} ${saved ? '저장 해제' : '저장'}`}
            onClick={onSave}
          >
            <CardIcon name={saved ? 'bookmark-filled' : 'bookmark'} />
          </button>
        </div>
        <h2 id={titleId} className="text-title-18-sb wrap-anywhere sm:text-title-22-sb">
          {card.title}
        </h2>
        <ArticleSummary
          summary={card.summary}
          expanded={summaryExpanded}
          onToggle={onSummaryToggle}
          sourceUrl={card.sourceUrl}
        />
      </div>
      <div className="flex flex-col gap-4 border-t-1 border-border-medium px-5 pt-4 pb-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-title-14-r text-brand-primary sm:text-title-16-m">
              <CardIcon name="quote" />
              <span>이렇게 말해보세요</span>
            </div>
            <button
              type="button"
              className={`${iconButtonStyle} gap-1 border-1 border-border-medium bg-surface-default py-1 pr-2 pl-3`}
              disabled={regenerating || regenerationDisabled}
              aria-busy={regenerating}
              aria-label={`${card.title} 대화 문장 바꾸기`}
              aria-describedby={`${titleId}-attempts`}
              onClick={onRegenerate}
            >
              <span id={`${titleId}-attempts`} className="flex items-center gap-card-retry-count">
                <span className="text-label-14-m text-content-body">{sentenceIndex + 1}</span>
                <span className="text-label-14-r text-content-normal">
                  / {card.sentences.length}
                </span>
              </span>
              <CardIcon name="refresh" />
            </button>
          </div>
          <p
            className="rounded-control bg-surface-smalltalk p-3 text-body-16-r wrap-anywhere text-content-body sm:text-body-18-r"
            aria-live="polite"
            aria-atomic="true"
          >
            {sentence}
          </p>
        </div>
        <Button variant="primary" size="L" onClick={onCopy} aria-label={`${card.title} 문장 복사`}>
          복사
        </Button>
      </div>
    </article>
  );
}
