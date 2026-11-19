export function Badge({ children }: { children: string }) {
  const style =
    'inline-flex w-fit text-caption-12-m rounded-pill opacity-badge bg-neutral-800 px-2 py-1 text-white';
  return <span className={style}>{children}</span>;
}
