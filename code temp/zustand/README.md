# 여러 컴포넌트의 상태 공유·Selector

`ZustandExample`을 Client Component에서 렌더링하면 두 영역이 표시됩니다. A 안의 버튼을 누르거나 이름을 수정하면 A의 다른 자식들이 같은 상태를 표시합니다. B는 다른 provider에 속해 영향을 받지 않습니다.

```text
CounterProvider A → store A
  CounterPanel                 배치만 담당, 상태 구독 없음
    CounterHeading             label 구독
    CounterNameInput            label + setLabel 구독
    CounterDisplays            중간 컴포넌트, props 전달 필요 없음
      CounterValue             count 구독
      CounterSummary           count + label 구독, useShallow
    CounterControls            increment + reset 함수만 구독
CounterProvider B → store B     A와 독립된 상태
```

## 상태가 공유되는 흐름

1. CounterProvider가 createCounterStore로 store를 생성합니다.
2. Context로 자손에게 같은 store 인스턴스를 전달합니다.
3. 자손은 useCounter(selector)로 가장 가까운 provider의 store를 구독합니다.
4. 버튼의 increment가 set으로 count를 갱신합니다.
5. count를 선택한 CounterValue와 CounterSummary가 새 값을 표시합니다.

깊은 자손도 같은 Context를 읽으므로 중간 컴포넌트마다 store를 props로 전달할 필요가 없습니다. 서로 다른 페이지에서도 상태를 공유하려면 공통으로 유지되는 Client provider 아래에 두 페이지의 컴포넌트가 있어야 합니다. 예제처럼 각 영역에 별도 provider를 만들면 상태가 분리됩니다. provider가 unmount되면 해당 메모리 상태는 유지되지 않습니다.

## 필요한 값만 선택

```tsx
const count = useCounter((state) => state.count);
const increment = useCounter((state) => state.increment);
```

count만 읽는 컴포넌트는 label 변경을 구독하지 않습니다. action만 읽는 버튼은 이 예제에서 함수 참조가 유지되므로 count 변경에 따른 구독 재렌더가 없습니다. selector 결과는 기본적으로 Object.is로 비교합니다. `useCounter((state) => state)`는 전체 상태를 선택하므로 관련 없는 필드 변경에도 반응합니다.

이 최적화는 store 구독에 의한 재렌더에 적용됩니다. 부모의 재렌더·props 변경까지 막는 것은 아닙니다. 예제에서는 CounterPanel이 구독을 하지 않고 자식들이 직접 값을 선택해 흐름을 구분합니다.

## 여러 값을 객체로 선택

```tsx
const { count, label } = useCounter(
  useShallow((state) => ({ count: state.count, label: state.label })),
);
```

매 호출마다 새 object를 반환하면 Object.is 비교는 항상 달라집니다. Zustand v5에서는 무한 갱신을 유발할 수도 있습니다. useShallow로 각 선택 필드를 얕게 비교하거나 단일 selector 두 개로 나눕니다. 깊은 object 비교가 아니므로 중첩 object는 불변 갱신으로 참조를 바꿔야 합니다.

## 직접 확인

- A에서 증가: A의 현재 값과 요약만 바뀌고 B는 0 유지.
- A에서 이름 변경: A의 제목·입력·요약에 같은 이름 표시, count 유지.
- A에서 초기화: A의 count만 0으로 복원, 이름 유지.

store.ts와 example.tsx에 생성 → 전달 → 구독 → action → 화면 갱신 순서로 주석이 있습니다. 서버 데이터는 TanStack Query, 폼 입력은 RHF를 사용하고 Zustand에는 공유 UI 상태를 둡니다.

[Zustand Context/Selector](https://github.com/pmndrs/zustand/blob/main/docs/reference/hooks/use-store.md) · [useShallow](https://github.com/pmndrs/zustand/blob/main/docs/reference/hooks/use-shallow.md)
