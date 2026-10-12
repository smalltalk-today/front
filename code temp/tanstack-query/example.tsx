'use client';

import { useState } from 'react';
import { QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createQueryClient } from '@/shared/lib/query';
import { Button } from '@/shared/ui';
import { ItemForm } from '../react-hook-form-zod/item-form';
import { createItemApi, type ItemApi } from './api';
import { itemKeys, itemsQueryOptions } from './queries';

export function QueryExample() {
  // 예제 인스턴스마다 캐시와 메모리 API를 생성합니다. 재렌더 시에는 같은 인스턴스를 유지합니다.
  const [client] = useState(createQueryClient);
  const [api] = useState(createItemApi);
  return (
    <QueryClientProvider client={client}>
      <ItemList api={api} />
    </QueryClientProvider>
  );
}

function ItemList({ api }: { api: ItemApi }) {
  const client = useQueryClient();
  // CSR 흐름: 공통 옵션 → key로 캐시 확인 → 필요하면 queryFn 실행 → 로딩/데이터/오류 표시.
  const query = useQuery(itemsQueryOptions(api));
  const mutation = useMutation({
    mutationFn: api.create,
    onSuccess: async () => {
      // 생성 성공 → 목록 캐시를 stale로 표시 → 현재 구독 중인 목록을 재조회.
      // await하므로 목록 갱신이 끝날 때까지 mutateAsync와 폼 제출이 대기합니다.
      await client.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
  return (
    <section>
      <h2>항목 조회·등록</h2>
      {query.isPending && <p role="status">불러오는 중…</p>}
      {query.isError && (
        <p role="alert">
          {query.error.message}
          <Button onClick={() => void query.refetch()}>다시 조회</Button>
        </p>
      )}
      {query.data?.length === 0 && <p>등록된 항목이 없습니다.</p>}
      <ul>
        {query.data?.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
      <ItemForm
        onSubmit={async (input) => {
          // 폼의 검증된 값을 mutation에 전달합니다. 실패는 ItemForm이 입력을 유지하며 표시합니다.
          await mutation.mutateAsync(input);
        }}
      />
    </section>
  );
}
