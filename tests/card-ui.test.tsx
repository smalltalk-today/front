import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Card } from '@/entities/card/model/card';
import { ArticleSummary } from '@/entities/card/ui/article-summary';
import { CardFeed } from '@/entities/card/ui/card-feed';
import { SavedCardItem } from '@/entities/card/ui/saved-card-item';

const card: Card = {
  id: 'economy-1',
  category: '경제',
  title: '오늘의 경제 이야기',
  publishedAt: '2026-11-11',
  summary: ['첫 번째 요약', '두 번째 요약', '세 번째 요약'],
  sentences: ['함께 이야기해 볼까요?', '다른 문장입니다.'],
  sourceUrl: 'https://example.com/news/economy-1',
};

function props() {
  return {
    card,
    dateLabel: '오늘',
    sentence: card.sentences[0]!,
    sentenceIndex: 0,
    saved: false,
    onSave: vi.fn(),
    onCopy: vi.fn(),
    onRegenerate: vi.fn(),
    summaryExpanded: false,
    onSummaryToggle: vi.fn(),
  };
}

describe('Card source interactions', () => {
  it('keeps summary state controlled and supports a keyboard disclosure', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const { rerender } = render(
      <ArticleSummary
        summary={card.summary}
        sourceUrl={card.sourceUrl}
        expanded={false}
        onToggle={onToggle}
      />,
    );

    const toggle = screen.getByRole('button', { name: '이슈 3줄 요약' });
    toggle.focus();
    await user.keyboard('{Enter}');
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    const closedRegion = screen.getByRole('region', { hidden: true });
    expect(closedRegion).toHaveAttribute('inert');
    expect(closedRegion).not.toHaveAttribute('hidden');
    expect(closedRegion.className).toContain('content');
    expect(closedRegion.className).not.toContain('expanded');
    expect(closedRegion).toHaveAttribute('aria-hidden', 'true');

    rerender(
      <ArticleSummary
        summary={card.summary}
        sourceUrl={card.sourceUrl}
        expanded
        onToggle={onToggle}
      />,
    );

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(closedRegion).not.toHaveAttribute('inert');
    expect(closedRegion.className).toContain('expanded');
    expect(document.getElementById(toggle.getAttribute('aria-controls')!)).toBeInTheDocument();
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(3);
    const source = screen.getByRole('link', { name: '관련 기사 보기' });
    expect(source).toHaveAttribute('href', card.sourceUrl);
    expect(source).toHaveAttribute('target', '_blank');
    expect(source).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it.each([undefined, 'javascript:alert(1)', 'data:text/html,hello'])(
    'keeps an unavailable or unsafe article source non-interactive: %s',
    (sourceUrl) => {
      render(
        <ArticleSummary summary={card.summary} sourceUrl={sourceUrl} expanded onToggle={vi.fn()} />,
      );
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '관련 기사 보기' })).toBeDisabled();
    },
  );

  it('keeps bookmark state and its action separate from the article content', async () => {
    const user = userEvent.setup();
    const controls = props();
    const { rerender } = render(<CardFeed {...controls} />);
    const article = screen.getByRole('article', { name: card.title });
    const save = within(article).getByRole('button', { name: `${card.title} 저장` });
    expect(save).toHaveAttribute('aria-pressed', 'false');
    await user.click(save);
    expect(controls.onSave).toHaveBeenCalledTimes(1);
    expect(controls.onCopy).not.toHaveBeenCalled();
    expect(controls.onRegenerate).not.toHaveBeenCalled();
    expect(controls.onSummaryToggle).not.toHaveBeenCalled();

    rerender(<CardFeed {...controls} saved />);
    expect(
      within(article).getByRole('button', { name: `${card.title} 저장 해제` }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(within(article).getByText(controls.sentence)).toBeInTheDocument();
    expect(within(article).getByText('오늘')).toHaveAttribute('dateTime', card.publishedAt);
  });

  it('preserves the current sentence during regeneration and disables repeat requests', async () => {
    const user = userEvent.setup();
    const controls = props();
    const { rerender } = render(<CardFeed {...controls} />);
    const regenerate = screen.getByRole('button', { name: `${card.title} 대화 문장 바꾸기` });
    expect(regenerate).toHaveTextContent(/1\s*\/\s*2/);
    await user.click(regenerate);
    expect(controls.onRegenerate).toHaveBeenCalledTimes(1);

    rerender(<CardFeed {...controls} regenerating />);
    const pending = screen.getByRole('button', { name: `${card.title} 대화 문장 바꾸기` });
    expect(pending).toBeDisabled();
    expect(pending).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText(controls.sentence)).toBeInTheDocument();
    await user.click(pending);
    expect(controls.onRegenerate).toHaveBeenCalledTimes(1);

    rerender(<CardFeed {...controls} sentenceIndex={1} regenerationDisabled />);
    expect(regenerate).toHaveTextContent(/2\s*\/\s*2/);
    expect(regenerate).toBeDisabled();
    await user.click(screen.getAllByRole('button', { name: `${card.title} 문장 복사` })[0]!);
    expect(controls.onCopy).toHaveBeenCalledTimes(1);
  });

  it('keeps label and disclosure IDs unique when the same article is rendered twice', () => {
    const controls = props();
    render(
      <>
        <CardFeed {...controls} summaryExpanded />
        <CardFeed {...controls} summaryExpanded />
      </>,
    );

    const articles = screen.getAllByRole('article', { name: card.title });
    const labels = articles.map((article) => article.getAttribute('aria-labelledby'));
    expect(new Set(labels).size).toBe(2);
    const disclosures = screen.getAllByRole('button', { name: '이슈 3줄 요약' });
    const contentIds = disclosures.map((button) => button.getAttribute('aria-controls'));
    expect(new Set(contentIds).size).toBe(2);
    for (const id of contentIds) expect(document.getElementById(id!)).toBeInTheDocument();
  });

  it('opens saved details with a normal click or Enter without routing when the bookmark is removed', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onUnsave = vi.fn();
    render(<SavedCardItem card={card} dateLabel="오늘" onOpen={onOpen} onUnsave={onUnsave} />);

    const link = screen.getByRole('link', { name: card.title });
    expect(link).toHaveAttribute('href', '/card/economy-1');
    await user.click(link);
    expect(onOpen).toHaveBeenCalledExactlyOnceWith(card.id);
    link.focus();
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledTimes(2);
    onOpen.mockClear();

    await user.click(screen.getByRole('button', { name: `${card.title} 저장 해제` }));
    expect(onUnsave).toHaveBeenCalledExactlyOnceWith(card.id);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it.each([
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
  ])('leaves modified or middle-click saved links to the browser: %j', (eventOptions) => {
    const onOpen = vi.fn();
    render(<SavedCardItem card={card} dateLabel="오늘" onOpen={onOpen} onUnsave={vi.fn()} />);
    let applicationPrevented: boolean | undefined;
    function stopJsdomNavigation(event: MouseEvent) {
      applicationPrevented = event.defaultPrevented;
      event.preventDefault();
    }
    document.addEventListener('click', stopJsdomNavigation);
    try {
      fireEvent.click(screen.getByRole('link', { name: card.title }), eventOptions);
    } finally {
      document.removeEventListener('click', stopJsdomNavigation);
    }
    expect(applicationPrevented).toBe(false);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('encodes saved IDs and respects navigation already prevented by another handler', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const id = '경제/1 #detail';
    render(
      <div onClickCapture={(event) => event.preventDefault()}>
        <SavedCardItem card={{ ...card, id }} dateLabel="오늘" onOpen={onOpen} onUnsave={vi.fn()} />
      </div>,
    );
    const link = screen.getByRole('link', { name: card.title });
    expect(link).toHaveAttribute('href', `/card/${encodeURIComponent(id)}`);
    await user.click(link);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
