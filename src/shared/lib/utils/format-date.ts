function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDateStatus(date: Date) {
  const today = new Date();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDate(date, today)) return 'today';
  if (isSameDate(date, yesterday)) return 'yesterday';

  return 'other';
}

// 뉴스 날짜 표시
export function formatPublishedAt(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return '';

  const dateStatus = getDateStatus(date);

  const time = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (dateStatus === 'today') return `오늘, ${time}`;
  if (dateStatus === 'yesterday') return `어제, ${time}`;

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${month}.${day}, ${time}`;
}

// 북마크 날짜 표시
export function formatBookmarkDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return '';

  const dateStatus = getDateStatus(date);

  if (dateStatus === 'today') return '오늘';
  if (dateStatus === 'yesterday') return '어제';

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${month}월 ${day}일`;
}
