import { createStore } from 'zustand/vanilla';

export interface UiState {
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  reset: () => void;
}

export function createUiStore() {
  return createStore<UiState>()((set) => ({
    modalOpen: false,
    openModal: () => set({ modalOpen: true }),
    closeModal: () => set({ modalOpen: false }),
    reset: () => set({ modalOpen: false }),
  }));
}
