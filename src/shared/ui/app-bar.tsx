'use client';

import type { ReactNode } from 'react';

interface AppBarAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface AppBarProps {
  children?: ReactNode;
  leftAction?: AppBarAction;
  rightAction?: AppBarAction;
}

function Action({ label, icon, onClick }: AppBarAction) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-control focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <span aria-hidden="true" className="inline-flex">
        {icon}
      </span>
    </button>
  );
}

export function AppBar({ children, leftAction, rightAction }: AppBarProps) {
  return (
    <div className="flex h-card-header items-center gap-2 bg-surface-default px-4 text-content-strong">
      {leftAction && <Action {...leftAction} />}
      {children}
      {rightAction && (
        <div className="ml-auto">
          <Action {...rightAction} />
        </div>
      )}
    </div>
  );
}
