import { formatCardDate } from '../lib/format-card.date';
import { Category } from '../model/types';
import { CategoryBadge } from './category-badge';

export function CardMeta({ category, date }: { category: Category; date: string }) {
  return (
    <div className="flex items-center gap-x-2">
      <CategoryBadge category={category} />
      <p className={'text-caption-12-r text-text-strong sm:text-caption-14-r'}>
        {formatCardDate(date)}
      </p>
    </div>
  );
}
