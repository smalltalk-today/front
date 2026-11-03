export function Badge({ children }: { children: string }) {
  const style = 'text-caption-12-m rounded-full bg-neutral-800 px-2 py-1 text-white';
  return <span className={style}>{children}</span>;
}
