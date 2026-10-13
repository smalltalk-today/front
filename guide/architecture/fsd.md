# Feature-Sliced Design

FSD는 기술 종류만으로 코드를 나누지 않고 도메인과 사용자 행동 단위로 묶습니다. 레이어는 책임, slice는 도메인/유스케이스, segment는 구현 역할을 뜻합니다.

```text
app/                         Next.js 라우팅·layout·metadata
src/                        아래 도메인 slice는 배치 예시
  _app/                      provider·스타일·앱 초기화·mock 통합
  widgets/item-list/              조회 영역·수정 폼·모달 조합
  features/rename-item/  이름 수정 유스케이스
  entities/item/        항목 모델·조회 API
  shared/                    도메인 없는 UI·HTTP·설정·유틸
```

의존 방향: `_app → widgets → features → entities → shared`. 인접 레이어뿐 아니라 더 아래 레이어도 참조할 수 있습니다. 역방향 금지. 같은 레이어의 서로 다른 slice 직접 참조 금지. 공유가 필요하면 상위에서 조합하거나 실제 공통 모델을 entities로 이동합니다. `_app`, `shared`는 slice가 아닌 segment로 나누므로 내부 segment 간 참조 가능합니다.

Next.js 예약 폴더와 구분하기 위해 FSD app은 `_app`으로 표기. 이 프로젝트는 `_pages`를 사용하지 않습니다. `app/page.tsx`에서 default export 함수와 JSX로 페이지를 직접 조합합니다. 페이지 고유 제목·레이아웃·widget 배치는 page에 작성하고, 독립적인 화면 영역은 widgets에 둡니다. `layout.tsx`는 provider 연결, route 파일은 프레임워크 설정을 담당합니다. API 호출 구현·검증·비즈니스 로직은 해당 slice에 작성합니다.

```tsx
import { Home } from '@/widgets/home';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-12">
      <Home />
    </main>
  );
}
```

페이지 전체를 한 줄로 re-export하는 패턴은 기본으로 사용하지 않습니다. `main` 등 페이지 외곽 레이아웃은 page에서 소유해 widget 안에 중복 생성하지 않습니다.

## Segment

- `ui`: 화면과 이벤트 연결.
- `model`: 도메인 타입·폼 스키마·hook·업무 로직.
- `api`: HTTP 함수·query key/options·mutation 연결.
- `lib`: slice 내부 보조 함수.

필요한 segment만 생성합니다. shared에는 ui/api/config/lib가 있습니다. shared/lib의 query, ui-store는 개별 public entrypoint를 갖는 유틸 묶음입니다.

## Public API

```ts
import { itemsQueryOptions } from '@/entities/item';
// 금지: '@/entities/item/api/queries'
```

slice 내부는 상대 경로 사용. 외부는 `index.ts`에서 필요한 값만 named export. 서버 전용은 `index.server.ts` + `server-only`, 클라이언트 전용 provider/Modal은 `index.client.ts`에서 export. 모든 slice를 한 최상위 barrel로 묶지 않습니다.

ESLint 로컬 FSD 규칙은 import, re-export, 정적 dynamic import와 상대 경로를 검사합니다. 계산한 dynamic import는 정적으로 분석할 수 없어 사용하지 않습니다.

## 배치 판단

범용 Button → shared/ui. 항목 조회·모델 → entities/item. 이름 수정 → features/rename-item. 목록과 수정 모달 조합 → widgets/item-list. 전체 provider·mock 초기화 → _app. 둘 이상의 도메인에 재사용되지 않는 UI를 무조건 shared로 옮기지 않습니다.

[공식 FSD Next.js 가이드](https://feature-sliced.design/docs/guides/tech/with-nextjs)
