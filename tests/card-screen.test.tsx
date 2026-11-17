import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDemoCard, getDemoCards } from '@/entities/card';
import { useCardActionsStore } from '@/features/card-actions/index.client';
import { Toaster } from '@/shared/ui/index.client';
import { useToastStore } from '@/shared/lib/toast';
import { CardsScreen } from '@/widgets/cards/index.client';

const { push, notFound } = vi.hoisted(() => ({
  push: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('not-found');
  }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), notFound }));

const media = Object.assign(new EventTarget(), {
  matches: false,
  media: '(min-width: 80rem)',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
}) satisfies MediaQueryList;

beforeEach(() => {
  push.mockReset();
  notFound.mockClear();
  media.matches = false;
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media),
  );
  useCardActionsStore.setState(useCardActionsStore.getInitialState(), true);
  useToastStore.setState({ currentToast: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
  useCardActionsStore.setState(useCardActionsStore.getInitialState(), true);
  useToastStore.setState({ currentToast: null });
});

function feed() {
  return render(
    <>
      <CardsScreen view="feed" />
      <Toaster />
    </>,
  );
}

const now = '2026-11-11T01:00:00.000Z';

describe('card screen integration', () => {
  it('provides five detached demo cards with four sentences, without inventing a server source', () => {
    const cards = getDemoCards();
    expect(cards).toHaveLength(5);
    expect(new Set(cards.map((card) => card.category)).size).toBe(5);
    expect(cards.every((card) => card.sentences.length === 4)).toBe(true);
    expect(cards.every((card) => card.sourceUrl === undefined)).toBe(true);
    const first = cards[0]!;
    first.title = '호출자가 바꾼 제목';
    expect(getDemoCard(first.id)?.title).not.toBe(first.title);
    expect(getDemoCard('missing')).toBeUndefined();
  });

  it('starts all summaries collapsed, filters categories, and caps manual regeneration at three', async () => {
    const user = userEvent.setup();
    const card = getDemoCards()[0]!;
    feed();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    for (const trigger of screen.getAllByRole('button', { name: '이슈 3줄 요약' })) {
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    }
    await user.click(screen.getByRole('tab', { name: card.category }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    const article = screen.getByRole('article', { name: card.title });
    await user.click(within(article).getByRole('button', { name: '이슈 3줄 요약' }));
    expect(within(article).getAllByRole('listitem')).toHaveLength(3);
    await user.click(within(article).getByRole('button', { name: `${card.title} 저장` }));
    const savedSentence = useCardActionsStore.getState().saved[0]?.sentence;
    const regenerate = within(article).getByRole('button', {
      name: `${card.title} 대화 문장 바꾸기`,
    });
    expect(regenerate).toHaveTextContent(/1\s*\/\s*4/);
    for (const [index, sentence] of card.sentences.slice(1).entries()) {
      await user.click(regenerate);
      expect(within(article).getByText(sentence)).toBeInTheDocument();
      expect(regenerate).toHaveTextContent(new RegExp(`${index + 2}\\s*\\/\\s*4`));
    }
    expect(regenerate).toBeDisabled();
    expect(useCardActionsStore.getState().saved[0]?.sentence).toBe(savedSentence);
    expect(useCardActionsStore.getState().sentenceIndices[card.id]).toBe(3);
    await user.click(screen.getByRole('tab', { name: 'Today Pick' }));
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });

  it('copies the shown sentence and reports a refused clipboard request', async () => {
    const user = userEvent.setup();
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const card = getDemoCards()[0]!;
    feed();
    await user.click(screen.getByRole('button', { name: `${card.title} 문장 복사` }));
    expect(write).toHaveBeenLastCalledWith(card.sentences[0]);
    expect(screen.getByText('복사했어요!')).toBeInTheDocument();
    write.mockRejectedValueOnce(new Error('Permission denied'));
    await user.click(screen.getByRole('button', { name: `${card.title} 문장 복사` }));
    expect(screen.getByText('복사에 실패했어요. 잠시 후 다시 시도해 주세요.')).toBeInTheDocument();
  });

  it('filters saved snapshots and navigates with SPA callbacks while removal stays independent', async () => {
    const user = userEvent.setup();
    const cards = getDemoCards();
    useCardActionsStore.getState().toggleSave(cards[0]!, cards[0]!.sentences[0]!, now);
    useCardActionsStore.getState().toggleSave(cards[1]!, cards[1]!.sentences[0]!, now);
    render(<CardsScreen view="saved" />);
    expect(screen.getAllByRole('article')).toHaveLength(2);
    await user.click(screen.getByRole('tab', { name: cards[0]!.category }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    await user.click(screen.getByRole('link', { name: cards[0]!.title }));
    expect(push).toHaveBeenLastCalledWith(`/card/${cards[0]!.id}`);
    push.mockClear();
    await user.click(screen.getByRole('button', { name: `${cards[0]!.title} 저장 해제` }));
    expect(push).not.toHaveBeenCalled();
    expect(useCardActionsStore.getState().saved).toHaveLength(1);
    expect(screen.getByText('선택한 카테고리에 저장한 카드가 없어요.')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: '전체' }));
    expect(screen.getByRole('article', { name: cards[1]!.title })).toBeInTheDocument();
  });

  it('opens the saved snapshot first, keeps it immutable, and retains detail content after unsaving', async () => {
    const user = userEvent.setup();
    const original = getDemoCards()[0]!;
    const snapshot = { ...original, title: '저장 당시 제목' };
    useCardActionsStore.getState().toggleSave(snapshot, snapshot.sentences[0]!, now);
    render(<CardsScreen view="detail" cardId={original.id} />);
    const article = screen.getByRole('article', { name: snapshot.title });
    expect(within(article).getByText(snapshot.sentences[0]!)).toBeInTheDocument();
    expect(within(article).getByRole('button', { name: '이슈 3줄 요약' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await user.click(
      within(article).getByRole('button', { name: `${snapshot.title} 대화 문장 바꾸기` }),
    );
    expect(within(article).getByText(snapshot.sentences[1]!)).toBeInTheDocument();
    expect(useCardActionsStore.getState().saved[0]?.sentence).toBe(snapshot.sentences[0]);
    await user.click(within(article).getByRole('button', { name: `${snapshot.title} 저장 해제` }));
    expect(useCardActionsStore.getState().saved).toEqual([]);
    expect(screen.getByRole('article', { name: snapshot.title })).toBeInTheDocument();
    expect(within(article).getByText(snapshot.sentences[1]!)).toBeInTheDocument();
  });

  it('returns to Today Pick when a ranking view crosses the web breakpoint', async () => {
    const user = userEvent.setup();
    feed();
    await user.click(screen.getByRole('tab', { name: '랭킹' }));
    expect(screen.getByRole('tab', { name: '랭킹' })).toHaveAttribute('aria-selected', 'true');
    expect(within(screen.getByRole('tabpanel')).getByRole('region')).toBeInTheDocument();
    const ranking = screen.getByRole('tab', { name: '랭킹' });
    expect(ranking).toHaveFocus();
    ranking.hidden = true;
    ranking.blur();
    act(() => {
      media.matches = true;
      media.dispatchEvent(new Event('change'));
    });
    expect(screen.getByRole('tab', { name: 'Today Pick' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByRole('tab', { name: 'Today Pick' })).toHaveFocus();
  });

  it('renders the original empty-saved view and routes its explore action to the feed', async () => {
    const user = userEvent.setup();
    render(<CardsScreen view="saved" />);
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    await user.click(within(screen.getByRole('tabpanel')).getByRole('button'));
    expect(push).toHaveBeenLastCalledWith('/card');
  });

  it('shows the empty view when the last saved card is removed', async () => {
    const user = userEvent.setup();
    const card = getDemoCards()[0]!;
    useCardActionsStore.getState().toggleSave(card, card.sentences[0]!, now);
    render(<CardsScreen view="saved" />);

    await user.click(screen.getByRole('button', { name: `${card.title} 저장 해제` }));
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '아직 저장된 카드가 없어요' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '카드 피드 둘러보기' }));
    expect(push).toHaveBeenLastCalledWith('/card');
  });
});
