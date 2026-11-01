import { Button } from '@/shared/ui';

export function Home() {
  return (
    <>
      <div className="space-y-4">
        <p className="font-semibold text-brand">SMART TALK</p>
        <h1 className="text-display font-extrabold">대화를 시작하는 공간</h1>
        <p className="text-muted">Smart Talk를 준비하고 있습니다.</p>
        <h1 className="text-title1">페이지 제목</h1>
        <h2 className="text-headline1">섹션 제목</h2>
        <p className="text-body1">본문 내용</p>
        <span className="text-caption2">보조 설명</span>
        <div className="mt-2 space-y-4">
          <p>버튼 컴포넌트 예시</p>
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
        </div>
      </div>
    </>
  );
}
