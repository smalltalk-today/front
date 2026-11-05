'use client';
import React, { useId, useState } from 'react';

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
    ></AccordionContext.Provider>
  );
}

function AccordionTrigger({ children }: { children: React.ReactNode }) {
  return <button>{children}</button>;
}

function AccordionContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export { Accordion, AccordionContent, AccordionTrigger };
