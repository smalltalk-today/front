'use client';
import { cn } from '@/shared/lib/utils';
import { NavArrowDown } from 'iconoir-react';
import React, { useContext, useId, useState } from 'react';

type AccordionContextValue = {
  isOpen: boolean;
  onToggle: () => void;
  triggerId: string;
  contentId: string;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

type AccordionChild = [
  React.ReactElement<React.ComponentProps<typeof AccordionTrigger>, typeof AccordionTrigger>,
  React.ReactElement<React.ComponentProps<typeof AccordionContent>, typeof AccordionContent>,
];

interface AccordionProps {
  children: AccordionChild;
  defaultOpen?: boolean;
}

function Accordion({ children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const id = useId();

  const onToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <AccordionContext.Provider
      value={{
        isOpen,
        onToggle,
        triggerId: `${id}-trigger`,
        contentId: `${id}-content`,
      }}
    >
      <div className="flex flex-col rounded-control bg-surface-container">{children}</div>
    </AccordionContext.Provider>
  );
}

function AccordionTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(AccordionContext);

  if (!context) {
    throw new Error('AccordionTrigger는 Accordion 내부에서 사용해야 합니다.');
  }

  return (
    <button
      type="button"
      id={context.triggerId}
      aria-expanded={context.isOpen}
      aria-controls={context.contentId}
      onClick={context.onToggle}
      className={cn('flex cursor-pointer items-center justify-between p-3 text-left', className)}
    >
      <span className="text-label-14-m text-text-strong">{children}</span>
      <NavArrowDown
        aria-hidden="true"
        className={cn('accordion-icon text-icon-secondary', context.isOpen && 'rotate-180')}
      />
    </button>
  );
}

function AccordionContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const context = useContext(AccordionContext);

  if (!context) {
    throw new Error('AccordionContent는 Accordion 내부에서 사용해야 합니다.');
  }

  return (
    <div
      id={context.contentId}
      role="region"
      aria-labelledby={context.triggerId}
      aria-hidden={!context.isOpen}
      inert={!context.isOpen}
      className="accordion-content grid"
    >
      <div className="min-h-0 overflow-hidden">
        <div className={cn('flow-root px-3 pt-2 pb-4', className)}>{children}</div>
      </div>
    </div>
  );
}

export { Accordion, AccordionContent, AccordionTrigger };
