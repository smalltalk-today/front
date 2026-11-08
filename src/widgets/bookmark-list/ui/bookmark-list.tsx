import { List, ListItem } from '@/shared/ui';
import { Bookmark, BookmarkItem } from './bookmark-item';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onBookmarkClick: (id: number) => void;
}

export function BookmarkList({ bookmarks, onBookmarkClick }: BookmarkListProps) {
  // TODO: 로컬스토리지에서 북마크 목록 조회 / 북마크 상태 변경 시 목록 자동 갱신
  const bookmarkedItems = bookmarks.filter((bookmark) => bookmark.isBookmarked);
  return (
    <List className="gap-3">
      {bookmarkedItems.map((bookmark) => (
        <ListItem key={bookmark.id}>
          <BookmarkItem bookmark={bookmark} onBookmarkClick={onBookmarkClick} />
        </ListItem>
      ))}
    </List>
  );
}
