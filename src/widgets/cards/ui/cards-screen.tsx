'use client';

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { formatCardDate, getDemoCard, getDemoCards, type Card } from '@/entities/card';
import { CardFeed, SavedCardItem } from '@/entities/card/index.client';
import { useCardActionsStore } from '@/features/card-actions/index.client';
import { ROUTES } from '@/shared/config';
import { toast } from '@/shared/lib/toast';
import {
  CardEmpty,
  CardHeader,
  CardNavigation,
  CardRanking,
  CardTabs,
  type CardDestination,
  type CardTabValue,
} from '@/shared/ui/index.client';

type CardsScreenProps =
  | { view: 'feed' | 'saved'; cardId?: never }
  | { view: 'detail'; cardId: string }
  | { view: 'settings'; cardId?: never; children: ReactNode };

const destinations = {
  feed: ROUTES.cards,
  saved: ROUTES.savedCards,
  settings: ROUTES.cardSettings,
} satisfies Record<CardDestination, string>;

function subscribeToClock(): () => void {
  return () => undefined;
}

function todayInSeoul(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function serverDate(): string {
  return '';
}

export function CardsScreen(props: CardsScreenProps) {
  const { view, cardId } = props;
  const router = useRouter();
  const cards = getDemoCards();
  const saved = useCardActionsStore((state) => state.saved);
  const sentenceIndices = useCardActionsStore((state) => state.sentenceIndices);
  const toggleSave = useCardActionsStore((state) => state.toggleSave);
  const regenerate = useCardActionsStore((state) => state.regenerate);
  const [feedTab, setFeedTab] = useState<CardTabValue>('Today Pick');
  const [savedTab, setSavedTab] = useState<CardTabValue>('전체');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [detailCard, setDetailCard] = useState<Card | null>(null);
  const [detailSentence, setDetailSentence] = useState<{ id: string; value: string } | null>(null);
  // 서버 빌드 시각이 상대 날짜로 고정되지 않도록 브라우저의 날짜를 읽는다.
  const todayISO = useSyncExternalStore(subscribeToClock, todayInSeoul, serverDate);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 80rem)');
    function resetRanking() {
      if (!media.matches) return;
      setFeedTab((current) => (current === '랭킹' ? 'Today Pick' : current));
    }
    media.addEventListener('change', resetRanking);
    return () => media.removeEventListener('change', resetRanking);
  }, []);

  function navigate(target: CardDestination) {
    router.push(destinations[target]);
  }

  function openDetail(id: string) {
    router.push(ROUTES.cardDetail.replace('[id]', encodeURIComponent(id)));
  }

  function selectRank(id: string) {
    setFeedTab('Today Pick');
    window.requestAnimationFrame(() => {
      document.getElementById(`card-${id}`)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }

  function save(card: Card, sentence: string) {
    if (view === 'detail') {
      setDetailCard(card);
      setDetailSentence({ id: card.id, value: sentence });
    }
    const result = toggleSave(card, sentence, new Date().toISOString());
    if (result.ok) {
      if (result.action === 'saved') toast.success('저장했어요!');
      else toast('저장 해제했어요.');
    } else {
      toast.error(
        result.error === 'limit'
          ? '최대 50개까지 저장할 수 있어요.'
          : '저장에 실패했어요. 잠시 후 다시 시도해 주세요.',
      );
    }
  }

  function unsave(id: string) {
    const entry = useCardActionsStore.getState().saved.find((item) => item.card.id === id);
    if (entry) save(entry.card, entry.sentence);
  }

  async function copy(sentence: string) {
    try {
      await navigator.clipboard.writeText(sentence);
      toast.success('복사했어요!');
    } catch {
      toast.error('복사에 실패했어요. 잠시 후 다시 시도해 주세요.');
    }
  }

  function changeSentence(card: Card) {
    const result = regenerate(card);
    if (!result.ok) {
      toast.error('이 이슈의 문장은 최대 3번까지 바꿀 수 있어요.');
      return;
    }
    if (view === 'detail') setDetailSentence({ id: card.id, value: result.sentence });
  }

  function toggleSummary(id: string) {
    setExpanded((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  const snapshot = saved.find((entry) => entry.card.id === cardId);
  const detail =
    snapshot?.card ??
    (detailCard?.id === cardId ? detailCard : cardId ? getDemoCard(cardId) : undefined);
  const selected = view === 'saved' ? savedTab : feedTab;
  const visibleCards =
    view === 'detail'
      ? detail
        ? [detail]
        : []
      : cards.filter((card) => feedTab === 'Today Pick' || card.category === feedTab);
  const visibleSaved = saved.filter(
    (entry) => savedTab === '전체' || entry.card.category === savedTab,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className={view === 'feed' ? 'md:px-8 xl:flex xl:flex-col xl:gap-5' : 'md:px-8'}>
        <CardHeader view={view} onNavigate={navigate} />
        {(view === 'feed' || view === 'saved') && (
          <CardTabs
            mode={view}
            selected={selected}
            onSelect={view === 'saved' ? setSavedTab : setFeedTab}
          />
        )}
      </div>
      <div className="flex flex-1 items-stretch gap-5 px-4 md:px-8">
        <section
          id="card-content-panel"
          role={view === 'feed' || view === 'saved' ? 'tabpanel' : undefined}
          aria-label={
            view === 'settings' ? '설정 내용' : view === 'detail' ? '카드 상세' : selected
          }
          className="flex min-w-0 flex-1 flex-col gap-2"
        >
          {view === 'feed' && (
            <p className="flex min-h-10 items-center justify-end text-right text-body-14-r text-content-assistive">
              샘플 카드입니다. 저장 내용은 새로고침하면 사라집니다.
            </p>
          )}
          {props.view === 'settings' ? (
            props.children
          ) : view === 'saved' ? (
            saved.length === 0 ? (
              <CardEmpty onExplore={() => navigate('feed')} />
            ) : visibleSaved.length === 0 ? (
              <p className="py-8 text-body-16-r text-content-assistive">
                선택한 카테고리에 저장한 카드가 없어요.
              </p>
            ) : (
              visibleSaved.map((entry) => (
                <SavedCardItem
                  key={entry.card.id}
                  card={entry.card}
                  dateLabel={formatCardDate(entry.card.publishedAt, todayISO)}
                  onUnsave={unsave}
                  onOpen={openDetail}
                />
              ))
            )
          ) : view === 'feed' && feedTab === '랭킹' ? (
            <div className="xl:hidden">
              <CardRanking items={cards} onSelect={selectRank} />
            </div>
          ) : (
            visibleCards.map((card) => {
              const index = sentenceIndices[card.id] ?? 0;
              const sentence =
                view === 'detail' && detailSentence?.id === card.id
                  ? detailSentence.value
                  : view === 'detail' && snapshot
                    ? snapshot.sentence
                    : (card.sentences[index] ?? card.sentences[0]!);
              return (
                <CardFeed
                  key={card.id}
                  card={card}
                  sentence={sentence}
                  sentenceIndex={index}
                  dateLabel={formatCardDate(card.publishedAt, todayISO)}
                  saved={saved.some((entry) => entry.card.id === card.id)}
                  onSave={() => save(card, sentence)}
                  onCopy={() => void copy(sentence)}
                  onRegenerate={() => changeSentence(card)}
                  regenerationDisabled={index >= Math.min(3, card.sentences.length - 1)}
                  summaryExpanded={expanded.includes(card.id)}
                  onSummaryToggle={() => toggleSummary(card.id)}
                />
              );
            })
          )}
        </section>
        {view === 'feed' && (
          <aside className="hidden w-card-ranking shrink-0 xl:block" aria-label="오늘의 랭킹">
            <CardRanking items={cards} onSelect={selectRank} />
          </aside>
        )}
      </div>
      <CardNavigation selected={view === 'detail' ? 'saved' : view} onNavigate={navigate} />
    </div>
  );
}
