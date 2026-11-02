export function Badge({ children }: { children: string }) {
  const style = '';
  return (
    <span className="py-1 px-2 caption-12-m bg-neutral-800 rounded-full text-white">
      {children}
    </span>
  );
}
