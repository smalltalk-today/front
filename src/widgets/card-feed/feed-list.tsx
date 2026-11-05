'use client';

import { CardFeed } from './card-feed';

export function FeedList() {
  return (
    <CardFeed
      category="경제"
      date="2023-06-01"
      bookmarked={false}
      title="금리 변동에 예적금 관심...가입 전 비교할 조건은?"
      summaryLines={[
        '금리 변동으로 예적금 상품에 대한 관심이 높아지고 있어요.금리 변동으로 예적금 상품에 대한 관심이 높아지고 있어요.금리 변동으로 예적금 상품에 대한 관심이 높아지고 있어요.금리 변동으로 예적금 상품에 대한 관심이 높아지고 있어요.금리 변동으로 예적금 상품에 대한 관심이 높아지고 있어요.',
        '상품마다 기본 금리와 우대 금리 적용 조건이 달라요.',
        '가입 전 가입 기간과 중도 해지 시 적용되는 금리도 함께 비교해 보세요.',
      ]}
      sayTalk="예적금 가입 전 비교할 조건 알려줘"
      onClick={(id: string) => {
        console.log('북마크 클릭', id);
      }}
    />
  );
}
