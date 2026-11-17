import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TabContent, Tabs, type TabItem } from '@/shared/ui';

const tabs: TabItem[] = [
  { label: '임의 탭', value: 'custom-one' },
  { label: '다른 탭', value: 'custom-two' },
];

function Example() {
  const [selected, setSelected] = useState(tabs[0]!.value);
  return (
    <Tabs tabs={tabs} value={selected} onChange={setSelected}>
      <TabContent>선택: {selected}</TabContent>
    </Tabs>
  );
}

describe('기존 Tabs 공개 API', () => {
  it('임의의 탭을 클릭하고 내용을 유지한다', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('tab', { name: '다른 탭' }));
    expect(screen.getByRole('tab', { name: '다른 탭' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('선택: custom-two');
  });

  it('방향키와 Home, End로 탭 선택 및 포커스를 이동한다', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const first = screen.getByRole('tab', { name: '임의 탭' });
    const second = screen.getByRole('tab', { name: '다른 탭' });
    first.focus();
    await user.keyboard('{ArrowRight}');
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Home}');
    expect(first).toHaveFocus();
    await user.keyboard('{End}');
    expect(second).toHaveFocus();
  });
});
