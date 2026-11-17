/* eslint-disable @next/next/no-img-element -- Figma SVG의 고유 크기와 경로를 유지한다. */
const sources = {
  back: '/design/cards/back.svg',
  bookmark: '/design/cards/bookmark.svg',
  'bookmark-filled': '/design/cards/bookmark-filled.svg',
  'bookmark-nav': '/design/cards/bookmark-nav.svg',
  'bookmark-nav-inactive': '/design/cards/bookmark-nav-inactive.svg',
  'bookmark-top': '/design/cards/bookmark-top.svg',
  'chevron-down': '/design/cards/chevron-down.svg',
  'chevron-up': '/design/cards/chevron-up.svg',
  crown: '/design/cards/crown.svg',
  feed: '/design/cards/feed.svg',
  'feed-inactive': '/design/cards/feed-inactive.svg',
  quote: '/design/cards/quote.svg',
  refresh: '/design/cards/refresh.svg',
  settings: '/design/cards/settings.svg',
  'settings-nav': '/design/cards/settings-nav.svg',
  'settings-nav-inactive': '/design/cards/settings-nav-inactive.svg',
} as const;

export type CardIconName = keyof typeof sources;

export function CardIcon({ name }: { name: CardIconName }) {
  return <img src={sources[name]} alt="" aria-hidden="true" />;
}
