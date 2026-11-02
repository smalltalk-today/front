export interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info';
  duration: number;
  position: ToastPosition;
}

export type ToastPosition = `${'top' | 'center' | 'bottom'}-${'left' | 'center' | 'right'}`;

export interface ToastOptions {
  duration?: number;
  position?: ToastPosition;
}
