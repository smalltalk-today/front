import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// 커스텀 클래스 분류 문제로 인해 font-size 관련 추가
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'headline-22-sb',
            'headline-20-sb',
            'headline-16-m',
            'title-22-sb',
            'title-18-sb',
            'title-18-m',
            'title-16-m',
            'title-14-r',
            'body-18-r',
            'body-16-r',
            'body-14-r',
            'body-14-m',
            'label-16-sb',
            'label-16-r',
            'label-14-m',
            'label-14-r',
            'label-11-r',
            'label-18-sb',
            'caption-12-m',
            'caption-12-r',
            'caption-14-r',
            'headline-18-sb',
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
