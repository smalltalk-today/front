'use client';

import { Xmark } from 'iconoir-react';
import { Button } from '../button/button';
import { useEffect, useRef } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  buttonTxt?: string;
  buttonOnClick?: () => void;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  buttonTxt,
  buttonOnClick,
}: BottomSheetProps) {
  const bottomSheetRef = useRef<HTMLElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  // 포커스 이동 및 복원
  useEffect(() => {
    if (!isOpen) return;

    prevFocusRef.current = document.activeElement as HTMLElement;

    bottomSheetRef.current?.focus();

    return () => {
      prevFocusRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        aria-label={title ? undefined : '바텀시트'}
        tabIndex={-1}
        className="fixed bottom-0 left-0 z-50 flex h-[48vh] w-full flex-col rounded-t-lg bg-white p-4 shadow-lg"
      >
        <div className="mb-4.25 flex justify-center">
          <div className="h-1 w-8.5 rounded-full bg-neutral-200" />
        </div>
        <div className="mb-4.25 flex items-center justify-between">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          <button type="button" onClick={onClose} aria-label="바텀시트 닫기">
            <Xmark />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {buttonTxt && (
          <Button variant="primary" size="M" className="mb-12.5 shrink-0" onClick={buttonOnClick}>
            {buttonTxt}
          </Button>
        )}
      </section>
    </div>
  );
}
