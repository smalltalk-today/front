'use client';

import { useRef, useState } from 'react';
import { useCardActionsStore } from '@/features/card-actions/index.client';
import { toast } from '@/shared/lib/toast';
import { Button } from '@/shared/ui';
import { Modal } from '@/shared/ui/index.client';
import { SettingItem } from './setting-item';

export function CardSettings({ version }: { version: string }) {
  const [confirming, setConfirming] = useState(false);
  const savedHeading = useRef<HTMLHeadingElement>(null);
  const hasSavedCards = useCardActionsStore((state) => state.saved.length > 0);
  const clearSaved = useCardActionsStore((state) => state.clearSaved);

  function removeAll() {
    clearSaved();
    setConfirming(false);
    toast.success('저장한 카드를 모두 삭제했어요.');
    requestAnimationFrame(() => savedHeading.current?.focus());
  }

  return (
    <>
      <section className="border-b border-border-subtle pb-5">
        <h2 ref={savedHeading} tabIndex={-1} className="text-caption-14-r text-content-assistive">
          저장 목록
        </h2>
        <SettingItem label="저장 목록 전체 삭제">
          <Button
            variant="text"
            className="shrink-0 text-status-error"
            disabled={!hasSavedCards}
            onClick={() => setConfirming(true)}
          >
            전체 삭제
          </Button>
        </SettingItem>
      </section>
      <section className="pt-3">
        <h2 className="text-caption-14-r text-content-assistive">앱 정보</h2>
        <SettingItem label="앱 버전">
          <span className="text-caption-14-r text-content-assistive">v{version}</span>
        </SettingItem>
        <SettingItem label="이용약관">
          <span className="text-caption-14-r text-content-assistive">준비 중</span>
        </SettingItem>
        <SettingItem label="개인정보처리 방침">
          <span className="text-caption-14-r text-content-assistive">준비 중</span>
        </SettingItem>
      </section>
      <Modal
        open={confirming}
        title="저장한 카드를 모두 삭제하시겠어요?"
        onClose={() => setConfirming(false)}
        confirm={{ label: '삭제', onClick: removeAll }}
      >
        삭제한 카드는 되돌릴 수 없어요.
      </Modal>
    </>
  );
}
