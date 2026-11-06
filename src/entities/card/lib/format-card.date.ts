import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export function formatCardDate(date: string | Date | number) {
  const createdAt = dayjs(date)
    .utcOffset(9 * 60)
    .startOf('day');
  const today = dayjs()
    .utcOffset(9 * 60)
    .startOf('day');

  if (!createdAt.isValid() || !today.isValid()) return '';

  const days = today.diff(createdAt, 'day');

  if (days <= 0) return '오늘';
  if (days < 30) return `${days}일 전`;
  if (days < 365) return `${Math.floor(days / 30)}달 전`;
  return `${Math.floor(days / 365)}년 전`;
}
