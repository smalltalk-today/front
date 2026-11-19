'use client';
import { CardMeta, Category, IssueSummary } from '@/entities/card';
import { Accordion, AccordionContent, AccordionTrigger, Button, Card } from '@/shared/ui';
import { Bookmark, BookmarkSolid, RefreshDouble } from 'iconoir-react';
import Image from 'next/image';

export function CardFeed({
  category,
  date,
  bookmarked,

  title,
  summaryLines,

  sayTalk,
  onClick,
}: {
  category: Category;
  date: string;
  bookmarked: boolean;

  title: string;
  summaryLines: string[];

  sayTalk: string;
  onClick: (id: string) => void;
}) {
  return (
    <Card className="shadow-card">
      <div className="flex flex-col gap-y-3 border-b border-border-subtle pb-4">
        <div className="flex items-center justify-between">
          <CardMeta category={category} date={date} />
          <BookMarkButton onClick={onClick} bookmarked={bookmarked} />
        </div>
        <h2 className="text-title-18-sb text-text-strong sm:text-title-22-sb">{title}</h2>
        <Accordion>
          <AccordionTrigger>이슈 3줄 요약</AccordionTrigger>
          <AccordionContent>
            <IssueSummary items={summaryLines} />
          </AccordionContent>
        </Accordion>
      </div>
      <div className="mb-3 flex items-center gap-x-2 pt-4">
        <Image src="/images/logo.svg" alt="logo" width={24} height={24} />
        <p className="flex-1 text-title-14-r text-text-blue sm:text-title-16-m">
          이렇게 말해보세요
        </p>
        <button type="button" aria-label="말하기 예시 새로고침">
          <RefreshDouble aria-hidden="true" className="rotate-90 text-icon-secondary" />
        </button>
      </div>
      <div className="mb-4 rounded-control bg-surface-smalltalk p-3">
        <p className="text-body-16-r text-text-body sm:text-body-18-r">{sayTalk}</p>
      </div>
      <Button
        onClick={() => onClick('id')}
        variant="primary"
        size="L"
        className="text-label-18-sb text-white"
      >
        복사
      </Button>
    </Card>
  );
}

// TODO: 북마크 버튼 클릭 시 상태 변경 및 API 호출 로직 추가
// OPTIMISTIC UPDATE를 사용하여, 북마크를 호출? -> localhost 이기에 궂이 필요 없을 듯함
function BookMarkButton({
  bookmarked,
  onClick,
}: {
  bookmarked: boolean;
  onClick: (id: string) => void;
}) {
  return (
    <button onClick={() => onClick('id')}>
      {bookmarked ? <BookmarkSolid className="text-icon-selected" /> : <Bookmark />}
    </button>
  );
}
