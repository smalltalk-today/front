export function Card({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col rounded-card bg-white p-5">{children}</div>;
}
