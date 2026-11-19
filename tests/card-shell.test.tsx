import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CardHeader } from '@/shared/ui/card-header';
import { CardNavigation } from '@/shared/ui/card-navigation';
import { CardRanking } from '@/shared/ui/card-ranking';
import { CardTabs, type CardTabValue } from '@/shared/ui/card-tabs';

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe('card screen shell interactions', () => {
  it('opens settings from the header and marks the active destination', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    const { rerender } = render(<CardHeader view="feed" onNavigate={navigate} />);
    await user.click(screen.getByRole('button', { name: '저장 목록' }));
    expect(navigate).toHaveBeenLastCalledWith('saved');
    await user.click(screen.getByRole('button', { name: '설정' }));
    expect(navigate).toHaveBeenLastCalledWith('settings');
    expect(screen.queryByRole('button', { name: '카드 피드로 닫기' })).not.toBeInTheDocument();

    rerender(<CardHeader view="settings" onNavigate={navigate} />);
    expect(screen.getByRole('button', { name: '설정' })).toHaveAttribute('aria-current', 'page');

    rerender(<CardHeader view="saved" onNavigate={navigate} />);
    await user.click(screen.getByRole('button', { name: '카드 피드로 닫기' }));
    expect(navigate).toHaveBeenLastCalledWith('feed');

    rerender(<CardHeader view="detail" onNavigate={navigate} />);
    await user.click(screen.getByRole('button', { name: '카드 피드로 닫기' }));
    expect(navigate).toHaveBeenLastCalledWith('feed');
    const backButtons = screen.getAllByRole('button', { name: '저장 목록으로 돌아가기' });
    expect(backButtons).toHaveLength(2);
    for (const back of backButtons) {
      await user.click(back);
      expect(navigate).toHaveBeenLastCalledWith('saved');
    }
    await user.click(screen.getAllByRole('button', { name: '카드 피드로 이동' }).at(-1)!);
    expect(navigate).toHaveBeenLastCalledWith('feed');
  });

  it('shows only saved categories in the saved tab list', async () => {
    const user = userEvent.setup();
    const select = vi.fn();
    render(<CardTabs mode="saved" selected="전체" onSelect={select} panelId="saved-cards" />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      '전체',
      '경제',
      '테크',
      '문화',
      '사회',
      '환경',
    ]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-controls', 'saved-cards');
    await user.click(screen.getByRole('tab', { name: '테크' }));
    expect(select).toHaveBeenCalledWith('테크');
  });

  it('moves selection and keyboard focus with arrows, Home and End', async () => {
    function Tabs() {
      const [selected, setSelected] = useState<CardTabValue>('Today Pick');
      return <CardTabs mode="feed" selected={selected} onSelect={setSelected} />;
    }
    const user = userEvent.setup();
    render(<Tabs />);
    screen.getByRole('tab', { name: 'Today Pick' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: '경제' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: '경제' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: '환경' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: '랭킹' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: '랭킹' })).toHaveFocus();
  });

  it('skips a hidden ranking tab when choosing the next keyboard destination', async () => {
    const user = userEvent.setup();
    const select = vi.fn();
    render(<CardTabs mode="feed" selected="환경" onSelect={select} />);
    screen.getByRole('tab', { name: '랭킹' }).hidden = true;
    screen.getByRole('tab', { name: '환경' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Today Pick' })).toHaveFocus();
    expect(select).toHaveBeenLastCalledWith('Today Pick');
  });

  it('keeps a single tab stop and allows moving out in both directions', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">이전 영역</button>
        <CardTabs mode="saved" selected="테크" onSelect={vi.fn()} />
        <button type="button">다음 영역</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: '이전 영역' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('tab', { name: '테크' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: '다음 영역' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('tab', { name: '테크' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: '이전 영역' })).toHaveFocus();
  });

  it('keeps memory-preserving navigation in callbacks and marks the current page', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    render(<CardNavigation selected="saved" onNavigate={navigate} />);
    expect(screen.getByRole('button', { name: '저장' })).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('button', { name: '투데이 뉴스' }));
    expect(navigate).toHaveBeenCalledWith('feed');
    await user.click(screen.getByRole('button', { name: '설정' }));
    expect(navigate).toHaveBeenLastCalledWith('settings');
  });

  it('ranks only supplied cards, caps the visible list at ten and opens the selected id', async () => {
    const user = userEvent.setup();
    const select = vi.fn();
    const items = Array.from({ length: 11 }, (_, index) => ({
      id: `card-${index}`,
      title: `제목 ${index}`,
    }));
    render(<CardRanking items={items} onSelect={select} />);
    const ranking = screen.getByRole('region', { name: '오늘 대화 소재 TOP 10' });
    expect(within(ranking).getAllByRole('listitem')).toHaveLength(10);
    expect(within(ranking).queryByRole('button', { name: '11위 제목 10' })).not.toBeInTheDocument();
    await user.click(within(ranking).getByRole('button', { name: '2위 제목 1' }));
    expect(select).toHaveBeenCalledWith('card-1');
  });
});

// @ts-expect-error Categories remain a closed set from the source tab component.
void (<CardTabs mode="feed" selected="스포츠" onSelect={() => {}} />);
