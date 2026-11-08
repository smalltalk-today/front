import { formatPublishedAt } from '@/shared/lib/utils';
import { Clock, NavArrowRight } from 'iconoir-react';
import Link from 'next/link';

export interface Article {
  id: number;
  title: string;
  publishedAt: string;
}

interface ArticleItemProps {
  article: Article;
}

export function ArticleItem({ article }: ArticleItemProps) {
  return (
    <li>
      <article className="flex items-center justify-center gap-2 rounded-xl border border-neutral-100 bg-white px-3 py-4 pl-4">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <p className="text-label-16-m line-clamp-2 w-full tracking-[-0.02em] text-neutral-900">
            {article.title}
          </p>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Clock width={24} height={24} className="shrink-0 text-[#A2A4AB]" />
              <span className="text-label-14-m tracking-[-0.01em] text-neutral-900">발행시간</span>
            </div>

            <span className="text0 text-caption-14-r tracking-[-0.01em] text-neutral-600">
              {formatPublishedAt(article.publishedAt)}
            </span>
          </div>
        </div>
        <Link href="#">
          <NavArrowRight width={24} height={24} className="shrink-0 text-neutral-400" />
        </Link>
      </article>
    </li>
  );
}
