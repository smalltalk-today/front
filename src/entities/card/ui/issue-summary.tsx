import { cn } from '@/shared/lib/utils';

export function IssueSummary({ items }: { items: string[] }) {
  return (
    <ul className="list-none space-y-2 text-body-14-r leading-[1.6] text-content-normal sm:text-body-16-r">
      {items.map((item, index) => (
        <li
          key={index}
          className={cn(
            'relative pl-5 text-text-body',
            'before:absolute before:top-[6.5px] before:left-[6.5px]',
            "before:size-[3px] before:rounded-full before:bg-current before:content-['']",
          )}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
