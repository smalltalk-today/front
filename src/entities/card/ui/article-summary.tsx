'use client';

import { useId } from 'react';
import { cn } from '@/shared/lib/utils';
import { CardIcon } from '@/shared/ui';
import type { Card } from '../model/card';
import styles from './article-summary.module.css';

interface ArticleSummaryProps {
  summary: Card['summary'];
  expanded: boolean;
  onToggle: () => void;
  sourceUrl?: string;
}

export function ArticleSummary({ summary, expanded, onToggle, sourceUrl }: ArticleSummaryProps) {
  const id = useId();
  const triggerId = `${id}-trigger`;
  const contentId = `${id}-content`;
  const sourceHref = /^https?:\/\//i.test(sourceUrl ?? '') ? sourceUrl : undefined;
  const linkStyle =
    'inline-flex h-8 items-center justify-center rounded-control border-1 border-border-medium px-5 text-label-14-r focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2';

  return (
    <div className="flex flex-col rounded-control bg-surface-container text-content-body">
      <button
        type="button"
        id={triggerId}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-control p-3 text-left text-label-14-m text-content-strong focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={onToggle}
      >
        이슈 3줄 요약
        <span className={cn(styles.icon, expanded && styles.rotated)}>
          <CardIcon name="chevron-down" />
        </span>
      </button>
      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        aria-hidden={!expanded}
        inert={!expanded}
        className={cn(styles.content, expanded && styles.expanded)}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-4 px-3 pt-2 pb-4">
            <ul className="flex list-disc flex-col gap-2 pl-5 text-body-14-r sm:text-body-16-r">
              {summary.map((item, index) => (
                <li key={index} className="wrap-anywhere">
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              {sourceHref ? (
                <a
                  className={`${linkStyle} bg-surface-default text-content-strong hover:bg-surface-secondary-hover active:bg-surface-secondary-pressed`}
                  href={sourceHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  관련 기사 보기
                </a>
              ) : (
                <button
                  type="button"
                  className={`${linkStyle} cursor-not-allowed bg-surface-disabled text-neutral-400`}
                  disabled
                >
                  관련 기사 보기
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
