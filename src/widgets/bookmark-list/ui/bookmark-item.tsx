import Link from 'next/link';
import { Bookmark } from 'iconoir-react';
import { formatBookmarkDate } from '@/shared/lib/utils';

export interface Bookmark {
  id: number;
  category: string;
  createdAt: string;
  title: string;
  isBookmarked: boolean;
}

interface BookmarkItemProps {
  bookmark: Bookmark;
  onBookmarkClick: (id: number) => void;
}

export function BookmarkItem({ bookmark, onBookmarkClick }: BookmarkItemProps) {
  // TODO: 북마크 클릭 시 로컬스토리지에 상태 저장 및 동기화
  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-neutral-100 bg-white px-4 py-3">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* TODO: 이 부분은 추후 수정 예정 */}
          <span className="flex h-5 shrink-0 items-center justify-center rounded-full bg-neutral-800 px-2 text-caption-12-m text-white">
            {bookmark.category}
          </span>

          <span className="shrink-0 text-caption-12-r text-neutral-900">
            {formatBookmarkDate(bookmark.createdAt)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onBookmarkClick(bookmark.id)}
          aria-label={bookmark.isBookmarked ? '북마크 해제' : '북마크 추가'}
          aria-pressed={bookmark.isBookmarked}
          className="shrink-0"
        >
          <Bookmark
            width={24}
            height={24}
            color={bookmark.isBookmarked ? 'var(--color-blue-500)' : undefined}
            fill={bookmark.isBookmarked ? 'var(--color-blue-500)' : 'none'}
          />
        </button>
      </div>

      <Link href={``} className="block">
        <h3 className="text-label-16-m line-clamp-2 w-full text-neutral-900">{bookmark.title}</h3>
      </Link>
    </div>
  );
}
