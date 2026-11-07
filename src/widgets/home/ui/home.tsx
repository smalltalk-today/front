'use client';

import { TabContent, TabItem, Tabs } from '@/shared/ui';
import { useState } from 'react';

const tabs: TabItem[] = [
  { label: '전체', value: 'all' },
  { label: '경제 ', value: 'economy' },
  { label: '테크', value: 'tech' },
  { label: '문화', value: 'culture' },
  { label: '사회', value: 'society' },
  { label: '환경', value: 'environment' },
];

// 임시 데이터
const data = [
  { id: 1, title: '경제 콘텐츠 1', category: 'economy' },
  { id: 2, title: '테크 콘텐츠 1', category: 'tech' },
  { id: 3, title: '문화 콘텐츠 1', category: 'culture' },
  { id: 4, title: '사회 콘텐츠 1', category: 'society' },
  { id: 5, title: '환경 콘텐츠 1', category: 'environment' },
  { id: 6, title: '경제 콘텐츠 2', category: 'economy' },
  { id: 7, title: '테크 콘텐츠 2', category: 'tech' },
];
import { Button } from '@/shared/ui';

export function Home() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredData =
    activeTab === 'all' ? data : data.filter((item) => item.category === activeTab);
  return (
    <>
      <div className="space-y-4">
        <p className="text-brand font-semibold">SMART TALK</p>
        <h1 className="text-display font-extrabold">대화를 시작하는 공간</h1>
        <p className="text-muted">Smart Talk를 준비하고 있습니다.</p>
      </div>
      <div className="mt-8">
        <p className="mb-5 text-lg font-semibold">탭 컴포넌트 사용 예시</p>
        <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab}>
          <TabContent>
            <div className="mt-4">
              {filteredData.map((item) => (
                <div key={item.id}>{item.title}</div>
              ))}
            </div>
          </TabContent>
        </Tabs>
      <div className="mt-2 space-y-4">
        <p>버튼 컴포넌트 예시</p>
        <Button variant="primary" size="XS">
          Text
        </Button>
        <Button variant="primary" size="S">
          Text
        </Button>
        <Button variant="primary" size="M">
          Text
        </Button>
        <Button variant="primary" size="L">
          Text
        </Button>
        <Button variant="secondary" size="XS">
          Text
        </Button>
        <Button variant="secondary" size="S">
          Text
        </Button>
        <Button variant="secondary" size="M">
          Text
        </Button>
        <Button variant="secondary" size="L">
          Text
        </Button>
        <div className="flex gap-2">
          <Button variant="link">기사 원문</Button>
          <Button variant="link" disabled>
            기사 원문
          </Button>
        </div>
        <Button variant="text">다른 이슈로 바꾸기</Button>
        <div>
          <Button variant="icon" size="icon" aria-label="버튼 아이콘">
            icon
          </Button>
        </div>
        <div className="mt-2 space-y-4">
          <Button size="XS">더 보기</Button>
          <Button variant="secondary">더 보기</Button>
          <Button variant="icon">icon</Button>
        </div>
      </div>
    </>
  );
}
