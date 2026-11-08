import Link from 'next/link';

export interface Ranking {
  id: number;
  title: string;
}

interface RankingItemProps {
  article: Ranking;
  rank: number;
}

export function RankingItem({ article, rank }: RankingItemProps) {
  return (
    <Link
      href={``}
      className="box-border flex h-[50px] w-full flex-row gap-2 rounded-lg border border-neutral-100 bg-white py-3 pr-4 pl-3"
    >
      <span className="text-label-16-m h-6 w-6 shrink-0 text-center text-blue-600">
        {String(rank).padStart(2, '0')}
      </span>
      <h3 className="text-label-16-m line-clamp-1 min-w-0 flex-1 text-neutral-900">
        {article.title}
      </h3>
    </Link>
  );
}
