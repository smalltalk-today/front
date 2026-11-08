import { List, ListItem } from '@/shared/ui';
import { Ranking, RankingItem } from './ranking-item';

interface RankingListProps {
  articles: Ranking[];
}

export function RankingList({ articles }: RankingListProps) {
  return (
    <List>
      {articles.map((article, index) => (
        <ListItem key={article.id}>
          <RankingItem article={article} rank={index + 1} />
        </ListItem>
      ))}
    </List>
  );
}
