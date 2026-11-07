'use client';

import { BottomSheet, Button } from '@/shared/ui';
import { useState } from 'react';

export function Home() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="space-y-4">
        <p className="text-brand font-semibold">SMART TALK</p>
        <h1 className="text-display font-extrabold">대화를 시작하는 공간</h1>
        <p className="text-muted">Smart Talk를 준비하고 있습니다.</p>
      </div>
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
      <div className="mt-2 space-y-4">
        <p>바텀시트 컴포넌트 예시</p>
        <Button variant="primary" size="M" onClick={() => setIsOpen(true)}>
          바텀시트 열기
        </Button>

        <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="타이틀">
          설명
        </BottomSheet>
      </div>
    </>
  );
}
