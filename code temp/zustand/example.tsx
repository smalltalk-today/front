'use client';

import { createContext, useContext, useId, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Button, Input } from '@/shared/ui';
import { createCounterStore, type CounterState } from './store';

const CounterContext = createContext<ReturnType<typeof createCounterStore> | null>(null);

export function CounterProvider({ children }: { children: ReactNode }) {
  // 1. provider마다 store를 한 번 생성합니다. 전역 singleton이 아니므로 요청/예제별 상태가 분리됩니다.
  // Context는 상태값 전체가 아니라 동일한 store 인스턴스를 전달합니다.
  const [store] = useState(createCounterStore);
  return <CounterContext.Provider value={store}>{children}</CounterContext.Provider>;
}

export function useCounter<T>(selector: (state: CounterState) => T) {
  const store = useContext(CounterContext);
  if (!store) throw new Error('CounterProvider가 필요합니다.');
  // 2. 가장 가까운 provider의 store를 읽고 selector 결과만 구독합니다.
  // 기본 비교는 Object.is입니다. 결과가 같으면 store 변경으로 인한 재렌더가 발생하지 않습니다.
  // 부모 재렌더나 props 변경으로 발생하는 재렌더까지 차단하는 것은 아닙니다.
  return useStore(store, selector);
}

function CounterValue() {
  // count만 선택: label 변경에는 갱신하지 않고 count 변경 시에만 이 구독이 화면을 갱신합니다.
  const count = useCounter((state) => state.count);
  return <p aria-live="polite">현재 값: {count}</p>;
}

function CounterHeading() {
  // 같은 store를 사용하지만 label만 구독하므로 count 증가에는 이 구독이 반응하지 않습니다.
  const label = useCounter((state) => state.label);
  return <h3>{label}</h3>;
}

function CounterControls() {
  // 3. 값을 구독하지 않고 action 함수만 선택합니다. count/label이 바뀌어도 함수 참조는 유지됩니다.
  // 버튼 클릭 → increment의 set → 같은 store의 count 갱신 → CounterValue와 CounterSummary 갱신.
  const increment = useCounter((state) => state.increment);
  const reset = useCounter((state) => state.reset);
  return (
    <div>
      <Button onClick={increment}>증가</Button>
      <Button onClick={reset}>초기화</Button>
    </div>
  );
}

function CounterNameInput() {
  const id = useId();
  const label = useCounter((state) => state.label);
  const setLabel = useCounter((state) => state.setLabel);
  return (
    <div>
      <label htmlFor={id}>카운터 이름</label>
      {/* 입력 → setLabel → 공유 label 변경 → 제목·입력·요약 갱신. count 표시값은 그대로 유지됩니다. */}
      <Input id={id} value={label} onChange={(event) => setLabel(event.target.value)} />
    </div>
  );
}

function CounterSummary() {
  // 4. 여러 필드를 객체로 선택할 때는 useShallow로 각 필드의 얕은 비교 결과를 재사용합니다.
  // 새 객체를 그대로 반환하면 참조가 매번 달라집니다. Zustand v5에서는 무한 갱신도 유발할 수 있습니다.
  // 아래 요약은 count 또는 label 변경에 반응하고 action 같은 다른 필드 변경은 구독하지 않습니다.
  const { count, label } = useCounter(
    useShallow((state) => ({ count: state.count, label: state.label })),
  );
  return (
    <p aria-live="polite">
      요약: {label} / {count}
    </p>
  );
}

function CounterDisplays() {
  // 중간 컴포넌트에 store를 props로 전달할 필요가 없습니다. 깊은 자식도 같은 Context에 접근합니다.
  return (
    <div>
      <CounterValue />
      <CounterSummary />
    </div>
  );
}

function CounterPanel({ title }: { title: string }) {
  const id = useId();
  // 부모는 store를 구독하지 않고 자식들을 배치합니다. 각 자식이 필요한 상태를 직접 선택합니다.
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      <CounterHeading />
      <CounterNameInput />
      <CounterDisplays />
      <CounterControls />
    </section>
  );
}

// 같은 provider 아래 컴포넌트는 상태를 공유합니다. 별도 provider의 상태는 독립적입니다.
export function ZustandExample() {
  return (
    <>
      {/* A 안의 제목·입력·표시·버튼은 하나의 store를 공유합니다. */}
      <CounterProvider>
        <CounterPanel title="공유 영역 A" />
      </CounterProvider>
      {/* B는 별도 store입니다. A에서 증가/이름 변경을 해도 B에는 반영되지 않습니다. */}
      <CounterProvider>
        <CounterPanel title="독립 영역 B" />
      </CounterProvider>
    </>
  );
}
