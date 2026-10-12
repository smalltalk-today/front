'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { demoItemsQueryOptions, type DemoItem } from '@/entities/demo-item';
import { RenameItemForm } from '@/features/rename-demo-item';
import { useUiStore } from '@/shared/lib/ui-store/index.client';
import { Button } from '@/shared/ui';
import { Modal } from '@/shared/ui/index.client';

export function Demo() {
  const query = useQuery(demoItemsQueryOptions());
  const [selected, setSelected] = useState<DemoItem | null>(null);
  const open = useUiStore((state) => state.modalOpen);
  const openModal = useUiStore((state) => state.openModal);
  const closeModal = useUiStore((state) => state.closeModal);
  return (
    <section className="panel space-y-6" aria-label="데모 항목">
      {query.isPending && <p role="status">불러오는 중…</p>}
      {query.isError && (
        <div role="alert" className="space-y-4">
          <p className="text-danger">{query.error.message}</p>
          <Button onClick={() => void query.refetch()}>다시 시도</Button>
        </div>
      )}
      {!query.isError && query.data?.length === 0 && <p>항목이 없습니다.</p>}
      <ul className="space-y-4">
        {query.data?.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-4">
            <span>{item.name}</span>
            <Button
              onClick={() => {
                setSelected(item);
                openModal();
              }}
            >
              이름 수정
            </Button>
          </li>
        ))}
      </ul>
      <Modal open={open} title="항목 이름 수정" onClose={closeModal}>
        {selected && <RenameItemForm item={selected} onSuccess={closeModal} />}
      </Modal>
    </section>
  );
}
