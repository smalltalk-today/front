'use client';

import { CardMeta } from '@/entities/card';
import { Accordion, AccordionContent, AccordionTrigger } from '@/shared/ui';

export function Home() {
  return (
    <>
      <div className="space-y-4">
        <p className="text-brand font-semibold">SMART TALK</p>
        <h1 className="text-display font-extrabold">대화를 시작하는 공간</h1>
        <p className="text-muted">Smart Talk를 준비하고 있습니다.</p>
        <CardMeta category="경제" date="2023-06-01" />

        <Accordion>
          <AccordionTrigger>버튼</AccordionTrigger>
          <AccordionContent>asd</AccordionContent>
        </Accordion>
      </div>
    </>
  );
}
