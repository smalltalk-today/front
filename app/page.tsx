'use client';

import { Button } from '@/shared/ui';
import { Article, ArticleList } from '@/widgets/article-list';
import { BookmarkList } from '@/widgets/bookmark-list';
import { Home } from '@/widgets/home';
import { RankingList } from '@/widgets/ranking-list';
import { SettingItem } from '@/widgets/setting-list';
import { NavArrowRight } from 'iconoir-react';
import Link from 'next/link';
import { useState } from 'react';

// TODO: 삭제 예정 START
const articlesData: Article[] = [
  {
    id: 1,
    title: '인공지능 기술 발전으로 변화하는 미래 산업의 새로운 방향',
    publishedAt: '2026-11-08T08:00:00+09:00',
  },
  {
    id: 2,
    title: '국내 IT 기업들의 새로운 기술 개발 동향과 시장 전망',
    publishedAt: '2026-11-07T08:00:00+09:00',
  },
];
const bookmarkData = [
  {
    id: 1,
    category: '테크',
    createdAt: '2026-11-08',
    title: '인공지능 기술의 발전과 앞으로 달라질 미래',
    isBookmarked: true,
  },
  {
    id: 2,
    category: '경제',
    createdAt: '2026-11-07',
    title: '2026년 글로벌 경제 시장의 주요 변화와 전망',
    isBookmarked: true,
  },
];

const rankingData = [{ id: 1, title: '첫 번째 랭킹 제목입니다.' }];
// TODO: 삭제 예정 END

export default function HomePage() {
  // TODO: 삭제 예정 START
  const [bookmarks, setBookmarks] = useState(bookmarkData);

  const handleBookmarkClick = (id: number) => {
    setBookmarks((prev) =>
      prev.map((bookmark) =>
        bookmark.id === id ? { ...bookmark, isBookmarked: !bookmark.isBookmarked } : bookmark,
      ),
    );
  };
  // TODO: 삭제 예정 END
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-12">
      <Home />
      {/* TODO: 삭제 예정 START */}
      {/* 버튼 컴포넌트 예시 START */}
      <div className="text- mt-2 space-y-4">
        <p className="font-bold">버튼 컴포넌트 예시</p>
        <Button variant="primary" size="XS">
          Text
        </Button>
        <Button variant="primary" size="S">
          Text
        </Button>
        <Button variant="primary" size="M">
          Text
        </Button>
        <Button variant="primary" size="L">
          Text
        </Button>
        <Button variant="secondary" size="XS">
          Text
        </Button>
        <Button variant="secondary" size="S">
          Text
        </Button>
        <Button variant="secondary" size="M">
          Text
        </Button>
        <Button variant="secondary" size="L">
          Text
        </Button>
        <div className="flex gap-2">
          <Button variant="link">기사 원문</Button>
          <Button variant="link" disabled>
            기사 원문
          </Button>
        </div>
        <Button variant="text">다른 이슈로 바꾸기</Button>
        <div>
          <Button variant="icon" size="icon" aria-label="버튼 아이콘">
            icon
          </Button>
        </div>
        <div className="mt-2 space-y-4">
          <Button size="XS">더 보기</Button>
          <Button variant="secondary">더 보기</Button>
          <Button variant="icon">icon</Button>
        </div>
      </div>
      {/* 버튼 컴포넌트 예시 END */}
      {/* 리스트 컴포넌트 예시 START */}
      <p className="font-bold">리스트 컴포넌트 예시</p>
      <div>
        <ArticleList articles={articlesData} />
      </div>
      <div>
        <BookmarkList bookmarks={bookmarks} onBookmarkClick={handleBookmarkClick} />
      </div>
      <div>
        <RankingList articles={rankingData} />
      </div>
      <div>
        {/* 텍스트 */}
        <SettingItem label="text">
          <span className="text-label-14-r text-neutral-600">v1.0.0</span>
        </SettingItem>

        {/* 버튼 */}
        <SettingItem label="text">
          <button type="button" className="p-1 text-label-14-r text-red-500">
            다른 이슈로 바꾸기
          </button>
        </SettingItem>

        {/* 화살표 아이콘 */}
        <SettingItem label="text">
          <Link href="#">
            <NavArrowRight width={24} height={24} strokeWidth={1.5} className="text-neutral-400" />
          </Link>
        </SettingItem>

        {/* 링크 */}
        <SettingItem label="text">
          <Link href="#" className="text-label-14-r text-blue-600 underline">
            보기
          </Link>
        </SettingItem>
      </div>
      {/* 리스트 컴포넌트 예시 END */}
      {/* TODO: 삭제 예정 END */}
    </main>
  );
}
