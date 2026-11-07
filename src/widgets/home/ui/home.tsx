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
      </div>
    </>
  );
}
