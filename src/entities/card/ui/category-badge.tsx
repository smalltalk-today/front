import { Badge } from '@/shared/ui';

import type { Category } from '../model/types';

export function CategoryBadge({ category }: { category: Category }) {
  // TODO: 카테고리 실제 값으로 변경해야함
  const categoryMaps: Record<Category, string> = {
    경제: '경제',
    테크: '테크',
    문화: '문화',
    사회: '사회',
    환경: '환경',
  };
  return <Badge>{categoryMaps[category]}</Badge>;
}
