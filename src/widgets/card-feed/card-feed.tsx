import { CardMeta, IssueSummary } from '@/entities/card';
import { Accordion, AccordionContent, AccordionTrigger, Button, Card } from '@/shared/ui';
import { BookmarkSolid } from 'iconoir-react';
import Image from 'next/image';

const textArray = [
  '금리 변동으로 예적금 상품에 대한 관심이 높아지고 있어요.금리 변동으로 예적금 상품에 대한 관심이 높아지고 있어요.금리 변동으로 예적금 상품에 대한 관심이 높아지고 있어요.금리 변동으로 예적금 상품에 대한 관심이 높아지고 있어요.금리 변동으로 예적금 상품에 대한 관심이 높아지고 있어요.',
  '상품마다 기본 금리와 우대 금리 적용 조건이 달라요.',
  '가입 전 가입 기간과 중도 해지 시 적용되는 금리도 함께 비교해 보세요.',
];

export function CardFeed() {
  return (
    <Card className="shadow-card">
      <div className="flex flex-col gap-y-3 border-b border-border-subtle pb-4">
        <div className="flex items-center justify-between">
          <CardMeta category="경제" date="2023-06-01" />
          <BookMarkButton />
        </div>
        <h2 className="text-title-22-sb text-text-strong">
          금리 변동에 예적금 관심...가입 전 비교할 조건은?
        </h2>
        <Accordion>
          <AccordionTrigger>이슈 3줄 요약</AccordionTrigger>
          <AccordionContent>
            <IssueSummary items={textArray} />
          </AccordionContent>
        </Accordion>
      </div>
      <div className="mb-3 flex items-center gap-x-2 pt-4">
        <Image src="/images/logo.svg" alt="logo" width={24} height={24} />
        <p className="text-title-14-r text-text-blue">이렇게 말해보세요</p>
      </div>
      <div className="mb-4 rounded-control bg-surface-smalltalk p-3">
        <p className="text-body-18-r text-text-body">
          가입 전 가입 기간과 중도 해지 시 적용되는 금리도 함께 비교해 보세요.
        </p>
      </div>
      <Button variant="primary" size="L" className="text-label-18-sb text-white">
        복사
      </Button>
    </Card>
  );
}

// TODO: 북마크 버튼 클릭 시 상태 변경 및 API 호출 로직 추가
// OPTIMISTIC UPDATE를 사용하여, 북마크를 호출? -> localhost 이기에 궂이 필요 없을 듯함
function BookMarkButton() {
  // return       <Bookmark />
  return <BookmarkSolid className="text-icon-selected" />;
}
