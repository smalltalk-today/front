import { z } from 'zod';

// 컴포넌트 배치와 별개로 제출 데이터의 중첩 구조를 정의합니다.
// register 경로 profile.address.city와 contacts.0.email이 이 구조에 대응합니다.
export const profileSchema = z.object({
  profile: z.object({
    name: z.string().trim().min(1, '이름을 입력하세요.').max(40),
    address: z.object({ city: z.string().trim().min(1, '도시를 입력하세요.') }),
  }),
  newsletter: z.boolean(),
  contacts: z.array(z.object({ email: z.email('이메일 형식을 확인하세요.') })).max(5),
});
export type ProfileInput = z.infer<typeof profileSchema>;

// 매번 새 초기값을 반환합니다. 문자열/boolean/배열을 undefined 없이 초기화합니다.
export function emptyProfile(): ProfileInput {
  return { profile: { name: '', address: { city: '' } }, newsletter: false, contacts: [] };
}
