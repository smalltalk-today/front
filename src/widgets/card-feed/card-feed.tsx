import { CardMeta } from '@/entities/card';
import { BookmarkSolid } from 'iconoir-react';

export function CardFeed() {
  return (
    <div>
      <header className="flex items-center justify-between">
        <CardMeta category="경제" date="2023-06-01" />
        <BookMarkButton />
      </header>
    </div>
  );
}

// TODO: 북마크 버튼 클릭 시 상태 변경 및 API 호출 로직 추가
// OPTIMISTIC UPDATE를 사용하여, 북마크를 호출? -> localhost 이기에 궂이 필요 없을 듯함
function BookMarkButton() {
  // return       <Bookmark />
  return <BookmarkSolid className="text-icon-selected" />;
}
