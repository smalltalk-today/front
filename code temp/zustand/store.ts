import { createStore } from 'zustand/vanilla';

export interface CounterState {
  count: number;
  label: string;
  increment: () => void;
  reset: () => void;
  setLabel: (label: string) => void;
}

// store를 전역 singleton으로 두지 않고 factory로 생성해 provider/서버 요청별로 격리합니다.
export function createCounterStore() {
  return createStore<CounterState>()((set) => ({
    count: 0,
    label: '공유 카운터',
    // 이전 count를 기준으로 갱신합니다. 같은 store를 구독하는 표시 컴포넌트들이 변경을 받습니다.
    increment: () => set((state) => ({ count: state.count + 1 })),
    // set은 일부 필드만 병합합니다. count를 초기화해도 label과 action 함수는 유지됩니다.
    reset: () => set({ count: 0 }),
    // count와 독립된 필드입니다. label만 바꾸면 count-only 구독자는 영향을 받지 않습니다.
    setLabel: (label) => set({ label }),
  }));
}
