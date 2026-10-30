export interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info';
  duration: number;
}
