// @vitest-environment node
import { afterEach, describe, expect, test } from 'vitest';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDesign } from '../scripts/check-design.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const temporary: string[] = [];
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
async function put(root: string, file: string, content: string) {
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), content);
}
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'smart-talk-design-test-'));
  temporary.push(root);
  for (const name of ['app', 'src', 'design', 'public'])
    await cp(path.join(project, name), path.join(root, name), { recursive: true });
  await cp(path.join(project, 'tsconfig.json'), path.join(root, 'tsconfig.json'));
  await symlink(path.join(project, 'node_modules'), path.join(root, 'node_modules'), 'dir');
  return root;
}
async function manifest(
  root: string,
  name: string,
  change: (value: ReturnType<typeof JSON.parse>) => void,
) {
  const file = path.join(root, 'design', name);
  const value = JSON.parse(await readFile(file, 'utf8'));
  change(value);
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
  const sourceFile = path.join(root, 'design/source.json');
  const source = JSON.parse(await readFile(sourceFile, 'utf8'));
  source.files[name] = hash(await readFile(file));
  await writeFile(sourceFile, `${JSON.stringify(source, null, 2)}\n`);
}
async function codes(root: string) {
  return (await checkDesign(root)).map((d) => d.code);
}
async function approvedProbe(root: string) {
  await put(
    root,
    'src/shared/ui/probe.tsx',
    `import { styles } from './probe.style';
export function Probe({ tone = 'primary', children }: { tone?: 'primary' | 'alert'; children?: string }) {
  return <button type="button" className={styles({tone})}>{children}</button>;
}`,
  );
  await put(
    root,
    'src/shared/ui/probe.style.ts',
    `import { cva as make } from 'class-variance-authority';
export const styles = make('rounded-control bg-brand-primary px-2', {
  variants: { tone: { primary: 'text-white', alert: 'bg-status-error' } },
  defaultVariants: { tone: 'primary' },
});`,
  );
  await manifest(root, 'components.json', (value) =>
    value.approved.push({
      name: 'Probe',
      file: 'src/shared/ui/probe.tsx',
      source: { nodeId: '202:173' },
      styles: ['src/shared/ui/probe.style.ts'],
      allowedProps: ['children'],
      props: { tone: ['primary', 'alert'] },
    }),
  );
}
async function approvedNativeProbe(root: string) {
  await approvedProbe(root);
  await put(
    root,
    'src/shared/ui/probe.tsx',
    `import type {ComponentProps} from 'react';
import {cn} from '@/shared/lib/utils';
import {styles} from './probe.style';
type Props=Omit<ComponentProps<'button'>,'style'|'dangerouslySetInnerHTML'|'color'> & {tone?:'primary'|'alert'};
export function Probe({tone='primary',className,children,...props}:Props){return <button className={cn(styles({tone}),className)} {...props}>{children}</button>}`,
  );
  await manifest(root, 'components.json', (value) => {
    const probe = value.approved.find((entry: { name: string }) => entry.name === 'Probe');
    probe.nativeTag = 'button';
    probe.allowedProps = ['children', 'className'];
    probe.layoutProps = ['className'];
  });
}
async function geometryProbe(root: string, existingCode = false) {
  const theme = [
    {
      file: 'src/widgets/probe/ui/layout.module.css',
      variable: '--spacing-source-probe',
      value: '52px',
    },
  ];
  const evidence = 'evidence/geometry-probe.json';
  const snapshot = 'evidence/geometry-before.txt';
  const original = 'Original fixed height: 52px\n';
  if (existingCode) await put(root, `design/${snapshot}`, original);
  const geometry = {
    nodeId: '202:173',
    property: 'height',
    value: '52px',
    theme,
    source: existingCode
      ? { kind: 'existing-code', file: `design/${snapshot}`, sha256: hash(original) }
      : { kind: 'figma' },
  };
  await put(root, `design/${evidence}`, JSON.stringify({ version: 1, geometry: [geometry] }));
  const sourceFile = path.join(root, 'design/source.json');
  const source = JSON.parse(await readFile(sourceFile, 'utf8'));
  source.evidence[evidence] = hash(await readFile(path.join(root, `design/${evidence}`)));
  if (existingCode) source.evidence[snapshot] = hash(original);
  await writeFile(sourceFile, `${JSON.stringify(source, null, 2)}\n`);
  await put(
    root,
    theme[0]!.file,
    '.row { --spacing-source-probe: 52px; height: var(--spacing-source-probe); }',
  );
  await manifest(root, 'policy.json', (v) =>
    v.utilityGroups.push({
      prefixes: ['h'],
      role: 'layout',
      entries: {
        'source-probe': {
          tokens: [],
          theme,
          sourceGeometry: {
            nodeId: geometry.nodeId,
            property: geometry.property,
            value: geometry.value,
            evidence,
          },
        },
      },
    }),
  );
}
async function motionProbe(root: string) {
  await approvedProbe(root);
  const file = 'src/shared/ui/probe.module.css';
  const evidence = 'evidence/motion-probe.json';
  const snapshot = 'evidence/motion-before.txt';
  const definitions = [
    ['duration', 'transition-duration', '--duration-source-probe', '200ms'],
    ['rows', 'grid-template-rows', '--grid-source-probe', '0fr'],
    ['rotate', 'rotate', '--rotate-source-probe', '180deg'],
    ['easing', 'transition-timing-function', '--ease-source-probe', 'cubic-bezier(0, 0, 0.2, 1)'],
  ] as const;
  const original = definitions.map(([, property, , value]) => `${property}: ${value};`).join('\n');
  await put(root, `design/${snapshot}`, original);
  const geometry = definitions.map(([, property, variable, value]) => ({
    nodeId: '202:173',
    property,
    value,
    theme: [{ file, variable, value }],
    source: { kind: 'existing-code', file: `design/${snapshot}`, sha256: hash(original) },
  }));
  await put(root, `design/${evidence}`, JSON.stringify({ version: 1, geometry }));
  const sourceFile = path.join(root, 'design/source.json');
  const source = JSON.parse(await readFile(sourceFile, 'utf8'));
  source.evidence[evidence] = hash(await readFile(path.join(root, `design/${evidence}`)));
  source.evidence[snapshot] = hash(original);
  await writeFile(sourceFile, `${JSON.stringify(source, null, 2)}\n`);
  await manifest(root, 'components.json', (value) => {
    value.approved.find((entry: { name: string }) => entry.name === 'Probe').styles.push(file);
  });
  await manifest(root, 'policy.json', (value) => {
    value.utilityGroups.push({
      prefixes: ['motion'],
      role: 'appearance',
      entries: Object.fromEntries(
        definitions.map(([name], index) => [
          `source-probe-${name}`,
          {
            tokens: [],
            theme: geometry[index]!.theme,
            sourceGeometry: {
              nodeId: '202:173',
              property: geometry[index]!.property,
              value: geometry[index]!.value,
              evidence,
            },
          },
        ]),
      ),
    });
  });
  const declarations = definitions
    .map(([, , variable, value]) => `${variable}: ${value};`)
    .join('');
  const css = `.surface { ${declarations}
    grid-template-rows: var(--grid-source-probe);
    rotate: var(--rotate-source-probe);
    transition-property: grid-template-rows, rotate;
    transition-duration: var(--duration-source-probe);
    transition-timing-function: var(--ease-source-probe);
  }
  @media (prefers-reduced-motion: reduce) { .surface { transition: none; } }`;
  await put(root, file, css);
  return { file, css };
}
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('디자인 계약 차단', () => {
  test('현재 사용자 파일을 변경하지 않고 원본 토큰·핀된 기존 위반을 보존한다', async () => {
    const root = await fixture();
    expect(await checkDesign(root)).toEqual([]);
    const source = await readFile(path.join(root, 'src/widgets/home/ui/home.tsx'));
    expect(hash(source)).toBe(
      hash(await readFile(path.join(project, 'src/widgets/home/ui/home.tsx'))),
    );
    const all = await checkDesign(root, { includeLegacy: true });
    expect(all.some((d) => d.file === 'src/widgets/home/ui/home.tsx')).toBe(false);
    expect(all.length).toBeGreaterThan(0);
  });

  test('새 라우트·widget 구조와 출처가 있는 텍스트/간격 utility는 허용한다', async () => {
    const root = await fixture();
    await put(
      root,
      'src/widgets/probe/ui/probe.tsx',
      `export function Probe() { return <div className="flex flex-col gap-2"><p className="text-body-14-r text-content-strong">2026 padding 12px</p></div>; }`,
    );
    await put(
      root,
      'app/probe/page.tsx',
      `import { Probe } from '@/widgets/probe/ui/probe'; export default function Page(){return <main className="px-4"><Probe /></main>}`,
    );
    expect(await checkDesign(root)).toEqual([]);
  });

  test('명시된 비시각 데이터 provider는 허용하고 외부 시각 UI는 계속 차단한다', async () => {
    const root = await fixture();
    await put(
      root,
      'app/probe/page.tsx',
      `import { QueryClientProvider } from '@tanstack/react-query';import { getQueryClient } from '@/shared/lib/query'; export default function Page(){return <QueryClientProvider client={getQueryClient()}><p>Data</p></QueryClientProvider>}`,
    );
    expect(await checkDesign(root)).toEqual([]);
    await put(
      root,
      'app/probe/page.tsx',
      `import { Xmark } from 'iconoir-react';export default function Page(){return <Xmark/>}`,
    );
    expect(await codes(root)).toContain('DS_COMPONENT_UNKNOWN');
  });

  test('app 루트의 미등록 UI·직접 버튼·원본과 같은 직접 색상도 차단한다', async () => {
    const root = await fixture();
    await put(
      root,
      'app/ghost.tsx',
      `export function Ghost(){return <button className="bg-[#4285f4]">Hi</button>}`,
    );
    expect(await codes(root)).toEqual(
      expect.arrayContaining(['DS_COMPONENT_UNKNOWN', 'DS_NATIVE_UI', 'DS_TOKEN_LITERAL']),
    );
    await put(
      root,
      'app/unseen-js.jsx',
      `export function Hidden(){return <button className="bg-[#ff00ff]"/>}`,
    );
    expect(
      (await checkDesign(root)).some(
        (d) => d.file === 'app/unseen-js.jsx' && d.code === 'DS_COMPONENT_UNKNOWN',
      ),
    ).toBe(true);
  });

  test('기본 팔레트·등록 범위 밖 간격·구번호 타이포·미등록 breakpoint를 차단한다', async () => {
    const root = await fixture();
    await put(
      root,
      'app/probe/page.tsx',
      `export default function Page(){return <div className="bg-slate-500 p-11 text-label1 lg:flex"/>}`,
    );
    expect(await codes(root)).toEqual(
      expect.arrayContaining(['DS_TOKEN_UNKNOWN', 'DS_BREAKPOINT']),
    );
  });

  test('cn·조건부·배열·상수의 모든 분기를 분석하고 해석 불가 동적 클래스는 거부한다', async () => {
    const root = await fixture();
    await put(
      root,
      'src/widgets/probe/ui/probe.tsx',
      `import {cn} from '@/shared/lib/utils'; const safe=['flex','gap-2']; export function Probe({bad}:{bad:boolean}){return <div className={cn(safe,bad ? 'p-2':'p-11')}/>}`,
    );
    expect(await codes(root)).toContain('DS_TOKEN_UNKNOWN');
    await put(
      root,
      'src/widgets/probe/ui/probe.tsx',
      'export function Probe({tone}:{tone:string}){return <div className={`bg-${tone}`}/> }',
    );
    expect(await codes(root)).toContain('DS_CLASS_DYNAMIC');
  });

  test('정적 클래스 객체의 변경과 임의 cn 이름 위장은 거부한다', async () => {
    const root = await fixture();
    await put(
      root,
      'src/widgets/probe/ui/probe.tsx',
      `const x={root:'flex'}; const y=x; y.root='bg-[#bad]'; export function Probe(){return <div className={x.root}/>}`,
    );
    expect(await codes(root)).toContain('DS_CLASS_DYNAMIC');
    await put(
      root,
      'src/widgets/probe/ui/probe.tsx',
      `function cn(x:string){return 'bg-[#bad]'+x} export function Probe(){return <div className={cn('flex')}/>}`,
    );
    expect(await codes(root)).toContain('DS_CLASS_DYNAMIC');
  });

  test('미사용 CVA 분기도 검사하며 소유자가 없는 외형 helper를 차단한다', async () => {
    const root = await fixture();
    await put(
      root,
      'src/shared/ui/probe.style.ts',
      `import {cva} from 'class-variance-authority';export const styles=cva('flex',{variants:{tone:{safe:'gap-2',unused:'bg-[#ff00ff]'}}})`,
    );
    expect(await codes(root)).toContain('DS_TOKEN_LITERAL');
    await put(
      root,
      'src/shared/ui/probe.style.ts',
      `import {cva} from 'class-variance-authority';export const styles=cva('bg-brand-primary rounded-control')`,
    );
    expect(await codes(root)).toContain('DS_SCREEN_STYLE');
  });

  test('승인 UI는 FSD 별칭·재수출·namespace와 별도 CVA 소유 모듈을 지원한다', async () => {
    const root = await fixture();
    await approvedProbe(root);
    await put(root, 'src/shared/ui/probe-index.ts', `export { Probe as Verified } from './probe';`);
    await put(
      root,
      'app/probe/page.tsx',
      `import * as UI from '@/shared/ui/probe-index'; export default function Page(){return <UI.Verified tone="primary">Hello</UI.Verified>}`,
    );
    expect(await checkDesign(root)).toEqual([]);
  });

  test('등록 props도 알 수 없는 variant·외형 덮어쓰기·숨긴 style spread는 차단한다', async () => {
    const root = await fixture();
    await approvedProbe(root);
    await put(
      root,
      'app/probe/page.tsx',
      `import{Probe}from '@/shared/ui/probe'; const injected={style:{color:'red'}}; export default function Page(){return <Probe tone="other" look="new" className="bg-brand-primary" {...injected}/>}`,
    );
    expect(await codes(root)).toEqual(
      expect.arrayContaining(['DS_PROP', 'DS_PROP_SPREAD', 'DS_SCREEN_STYLE']),
    );
    await put(
      root,
      'src/shared/ui/probe.tsx',
      `export function Probe(){const x={style:{color:'red'}}; return <button {...x}/>}`,
    );
    expect(await codes(root)).toContain('DS_PROP_SPREAD');
  });

  test('허용 props에 시각 variant를 넣어 enum 검사를 우회할 수 없다', async () => {
    const root = await fixture();
    await approvedProbe(root);
    await manifest(root, 'components.json', (v) =>
      v.approved
        .find((entry: { name: string }) => entry.name === 'Probe')
        .allowedProps.push('size'),
    );
    expect(await codes(root)).toContain('DS_MANIFEST');
  });

  test('기존 미이관 파일 변경과 새 caller의 기존 UI 사용 확대를 차단한다', async () => {
    const root = await fixture();
    await put(
      root,
      'app/probe/page.tsx',
      `import {MswProvider}from '@/_app/mocks/provider';export default function Page(){return <MswProvider>test</MswProvider>}`,
    );
    expect(await codes(root)).toContain('DS_LEGACY_USE');
    await put(
      root,
      'src/_app/mocks/provider.tsx',
      `${await readFile(path.join(root, 'src/_app/mocks/provider.tsx'), 'utf8')}\n`,
    );
    expect(await codes(root)).toContain('DS_LEGACY_DRIFT');
  });

  test('기존 root 인프라만 허용하고 다른 경로와 위장한 글꼴은 차단한다', async () => {
    const root = await fixture();
    await manifest(root, 'legacy.json', (value) => {
      value.entries = value.entries.filter(
        (entry: { file: string }) => entry.file !== 'app/layout.tsx',
      );
    });
    const layout = `import {pretendard} from '@/_app/fonts';
import {Providers} from '@/_app/providers';
import '@/_app/styles/globals.css';
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html className={pretendard.variable}><body><Providers>{children}</Providers></body></html>;
}`;
    await put(root, 'app/layout.tsx', layout);
    expect((await checkDesign(root)).filter((d) => d.file === 'app/layout.tsx')).toEqual([]);

    await put(
      root,
      'app/probe/page.tsx',
      `import {pretendard} from '@/_app/fonts';
import {Providers} from '@/_app/providers';
import '@/_app/styles/globals.css';
export default function Page(){return <html className={pretendard.variable}><Providers /></html>}`,
    );
    expect(
      (await checkDesign(root)).filter((d) => d.file === 'app/probe/page.tsx').map((d) => d.code),
    ).toEqual(expect.arrayContaining(['DS_STYLE_IMPORT', 'DS_CLASS_DYNAMIC', 'DS_LEGACY_USE']));

    await put(
      root,
      'app/layout.tsx',
      layout
        .replace(
          "import {pretendard} from '@/_app/fonts';",
          'declare const pretendard: {variable: string};',
        )
        .replace("import '@/_app/styles/globals.css';", "import '@/_app/styles/colors.css';"),
    );
    expect(
      (await checkDesign(root)).filter((d) => d.file === 'app/layout.tsx').map((d) => d.code),
    ).toEqual(expect.arrayContaining(['DS_STYLE_IMPORT', 'DS_CLASS_DYNAMIC']));
  });

  test('구조 요소의 버튼 위장과 등록 토큰으로 새 카드 외형을 만드는 것을 차단한다', async () => {
    const root = await fixture();
    await put(
      root,
      'app/probe/page.tsx',
      `export default function Page(){return <article role="button" onClick={()=>{}} className="bg-brand-primary rounded-card px-4"/>}`,
    );
    expect(await codes(root)).toEqual(expect.arrayContaining(['DS_NATIVE_UI', 'DS_SCREEN_STYLE']));
  });

  test('inline style·HTML·태그 template·동적 import·DOM 주입을 차단한다', async () => {
    const root = await fixture();
    await put(
      root,
      'app/probe/page.tsx',
      'const x=import("foreign-ui");const s=styled.div`color:red`;document.body.innerHTML="<button/>";export default function Page(){return <div style={{color:"red"}} dangerouslySetInnerHTML={{__html:"x"}}/>}',
    );
    expect(await codes(root)).toEqual(
      expect.arrayContaining(['DS_STYLE_INJECTION', 'DS_DYNAMIC_IMPORT']),
    );
  });

  test('React factory 별칭·구조분해·동적 computed 접근을 차단한다', async () => {
    const root = await fixture();
    await put(
      root,
      'src/shared/ui/factories.ts',
      `import * as React from 'react';const create=React['create'+'Element'];const {['create'+'Element']: hidden}=React;export const view=create('button',{});`,
    );
    expect(await codes(root)).toContain('DS_FACTORY');
  });

  test('새 폰트·외부 UI와 직접 SVG를 차단한다', async () => {
    const root = await fixture();
    await put(
      root,
      'app/probe/page.tsx',
      `import{Roboto}from 'next/font/google';import{Xmark}from 'iconoir-react';export default function Page(){return <><Xmark/><svg><path d="M0 0"/></svg></>}`,
    );
    expect(await codes(root)).toEqual(
      expect.arrayContaining([
        'DS_IMPORT',
        'DS_COMPONENT_UNKNOWN',
        'DS_NATIVE_UI',
        'DS_STYLE_INJECTION',
      ]),
    );
  });

  test('승인 primitive에서도 외부 asset·HTML·legacy favicon의 UI 재사용을 차단한다', async () => {
    const root = await fixture();
    await approvedProbe(root);
    await put(
      root,
      'src/shared/ui/probe.tsx',
      `export function Probe(){return <><img src="https://example.com/x.svg"/><img src="/icon.svg"/><img srcSet="data:image/svg+xml,evil 1x"/><iframe srcDoc="<button/>"/><object data="https://example.com"/><embed src="data:text/html,evil"/></>}`,
    );
    expect(await codes(root)).toContain('DS_ASSET');
  });

  test('원본 승인·해시 고정한 static public asset만 허용한다', async () => {
    const root = await fixture();
    await approvedProbe(root);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"/>';
    await put(root, 'public/icons/source.svg', svg);
    await manifest(root, 'policy.json', (v) =>
      v.assets.push({
        file: 'public/icons/source.svg',
        url: '/icons/source.svg',
        status: 'approved',
        sha256: hash(svg),
        source: { nodeId: '280:1330' },
      }),
    );
    await put(
      root,
      'src/shared/ui/probe.tsx',
      `export function Probe(){return <img src="/icons/source.svg" srcSet="/icons/source.svg 1x, /icons/source.svg 2x"/>}`,
    );
    expect(await checkDesign(root)).toEqual([]);
    await put(root, 'public/icons/source.svg', svg + ' ');
    expect(await codes(root)).toContain('DS_MANIFEST');
  });

  test('원본 manifest·theme·폰트·metadata asset 변조와 신규 asset을 차단한다', async () => {
    const root = await fixture();
    await put(root, 'src/new-icon.svg', '<svg/>');
    expect(await codes(root)).toContain('DS_ASSET_UNKNOWN');
    await put(root, 'app/icon.png', 'invalid image');
    expect(await codes(root)).toContain('DS_MANIFEST');
  });

  test('CSS Module의 단일 배치 class는 허용하고 deep selector·토큰 타입·fallback·직접값은 차단한다', async () => {
    const root = await fixture();
    await put(
      root,
      'src/widgets/probe/ui/layout.module.css',
      '.row { display: flex; gap: var(--spacing); }',
    );
    await put(
      root,
      'src/widgets/probe/ui/probe.tsx',
      `import styles from './layout.module.css';export function Probe(){return <div className={styles.row}/>}`,
    );
    expect(await checkDesign(root)).toEqual([]);
    await put(
      root,
      'src/widgets/probe/ui/layout.module.css',
      '.host button { padding: var(--spacing); } .row { width:var(--color-blue-500); gap:var(--spacing, 8px); color:#ff00ff; }',
    );
    expect(await codes(root)).toEqual(
      expect.arrayContaining([
        'DS_SELECTOR',
        'DS_TOKEN_TYPE',
        'DS_TOKEN_UNKNOWN',
        'DS_TOKEN_LITERAL',
      ]),
    );
  });

  test('누락 명세·원본 alias 변조·오래된 theme·폰트 변경은 실패한다', async () => {
    const root = await fixture();
    await put(root, 'src/_app/styles/layout.css', '@theme { --spacing: 5px; }');
    const themeDiagnostics = await checkDesign(root);
    expect(themeDiagnostics.map((d) => d.code)).toContain('DS_TOKEN_DRIFT');
    const legacy = JSON.parse(await readFile(path.join(root, 'design/legacy.json'), 'utf8'));
    expect(
      themeDiagnostics.some(
        (d) => d.file === 'src/_app/styles/layout.css' && d.code === 'DS_LEGACY_DRIFT',
      ),
    ).toBe(
      legacy.entries.some((entry: { file: string }) => entry.file === 'src/_app/styles/layout.css'),
    );
    await manifest(root, 'tokens.json', (v) => {
      v.tokens[0].value = '#123456';
    });
    expect(await codes(root)).toContain('DS_MANIFEST');
    await rm(path.join(root, 'design/components.json'));
    expect(await codes(root)).toContain('DS_MANIFEST');
  });

  test('native: 승인 button의 유한 native rest와 ref·submit·배치 className을 보존한다', async () => {
    const root = await fixture();
    const baseline = await checkDesign(root);
    expect(baseline.some((d) => d.code === 'DS_MANIFEST')).toBe(false);
    await approvedNativeProbe(root);
    await put(
      root,
      'app/probe/page.tsx',
      `import{Probe}from '@/shared/ui/probe';export default function Page(){return <Probe tone="primary" type="submit" name="answer" value="yes" id="submit" disabled={false} onClick={()=>{}} ref={node=>{node?.focus()}} className="mt-2 w-full" aria-label="전송" data-testid="submit">Send</Probe>}`,
    );
    const before = new Set(baseline.map((d) => JSON.stringify(d)));
    expect((await checkDesign(root)).filter((d) => !before.has(JSON.stringify(d)))).toEqual([]);
  });

  test('native: style·className·시각 prop을 제거하지 않은 rest와 any/index는 거부한다', async () => {
    const root = await fixture();
    await approvedNativeProbe(root);
    for (const source of [
      `import type{ComponentProps}from'react';type Props=ComponentProps<'button'>;export function Probe({...props}:Props){return <button {...props}/>}`,
      `export function Probe({...props}:any){return <button {...props}/>}`,
      `import type{ComponentProps}from'react';type Props=Omit<ComponentProps<'button'>,'style'|'dangerouslySetInnerHTML'|'className'|'color'>&{onClick:any};export function Probe({...props}:Props){return <button {...props}/>}`,
      `import type{ComponentProps}from'react';type Props=Omit<ComponentProps<'button'>,'style'|'dangerouslySetInnerHTML'|'className'|'color'>&{[key:string]:unknown};export function Probe({...props}:Props){return <button {...props}/>}`,
      `import type{ComponentProps}from'react';type Props=Omit<ComponentProps<'button'>,'style'|'dangerouslySetInnerHTML'|'className'|'color'>&{tone?:'primary'|'alert'};export function Probe({...props}:Props){return <button {...props}/>}`,
    ]) {
      await put(root, 'src/shared/ui/probe.tsx', source);
      expect(
        (await checkDesign(root))
          .filter((d) => d.file === 'src/shared/ui/probe.tsx')
          .map((d) => d.code),
      ).toContain('DS_PROP_SPREAD');
    }
  });

  test('native: 승인 tag가 다른 rest·로컬 객체·caller spread·직접 style 주입은 거부한다', async () => {
    const root = await fixture();
    await approvedNativeProbe(root);
    const safeSource = await readFile(path.join(root, 'src/shared/ui/probe.tsx'), 'utf8');
    await put(
      root,
      'src/shared/ui/probe.tsx',
      `import type{ComponentProps}from'react';type Props=Omit<ComponentProps<'button'>,'style'|'dangerouslySetInnerHTML'|'color'>;export function Probe({className,children,...props}:Props){return <input {...props}/>}`,
    );
    expect(
      (await checkDesign(root))
        .filter((d) => d.file === 'src/shared/ui/probe.tsx')
        .map((d) => d.code),
    ).toContain('DS_PROP_SPREAD');
    await put(
      root,
      'src/shared/ui/probe.tsx',
      `export function Probe(){const attrs={type:'button'} as const;return <button {...attrs}/>}`,
    );
    expect(
      (await checkDesign(root))
        .filter((d) => d.file === 'src/shared/ui/probe.tsx')
        .map((d) => d.code),
    ).toContain('DS_PROP_SPREAD');
    await put(root, 'src/shared/ui/probe.tsx', safeSource);
    await put(
      root,
      'app/probe/page.tsx',
      `import{Probe}from '@/shared/ui/probe';const attrs={type:'submit'};export default function Page(){return <Probe {...attrs} style={{color:'hotpink'}}/>}`,
    );
    expect(
      (await checkDesign(root)).filter((d) => d.file === 'app/probe/page.tsx').map((d) => d.code),
    ).toEqual(expect.arrayContaining(['DS_PROP_SPREAD', 'DS_STYLE_INJECTION']));
  });

  test('native: caller className은 승인된 외형 부모 안에서도 배치만 허용한다', async () => {
    const root = await fixture();
    await approvedNativeProbe(root);
    await put(
      root,
      'src/shared/ui/outer.tsx',
      `import{Probe}from './probe';export function Outer(){return <Probe className="bg-brand-primary"/>}`,
    );
    await manifest(root, 'components.json', (v) =>
      v.approved.push({
        name: 'Outer',
        file: 'src/shared/ui/outer.tsx',
        source: { nodeId: '202:173' },
        allowedProps: [],
        props: {},
      }),
    );
    expect(await codes(root)).toContain('DS_SCREEN_STYLE');
    await put(
      root,
      'src/shared/ui/outer.tsx',
      `import{Probe}from './probe';export function Outer(){return <Probe className="outline-none"/>}`,
    );
    expect(await codes(root)).toContain('DS_SCREEN_STYLE');
  });

  test('native: layout param을 중립 문자열로 해석해 concat의 다른 분기를 빠뜨리지 않는다', async () => {
    const root = await fixture();
    await approvedNativeProbe(root);
    const source = await readFile(path.join(root, 'src/shared/ui/probe.tsx'), 'utf8');
    await put(
      root,
      'src/shared/ui/probe.tsx',
      source.replace('className)}', 'className + " bg-[#ff00ff]")}'),
    );
    expect(await codes(root)).toContain('DS_TOKEN_LITERAL');
  });

  test('geometry: 추가 토큰 없이 고정한 node·속성·값·실제 theme가 정확히 맞는 치수만 허용한다', async () => {
    const root = await fixture();
    const baseline = await checkDesign(root);
    expect(baseline.some((d) => d.code === 'DS_MANIFEST')).toBe(false);
    await geometryProbe(root);
    const before = new Set(baseline.map((d) => JSON.stringify(d)));
    expect((await checkDesign(root)).filter((d) => !before.has(JSON.stringify(d)))).toEqual([]);
    await manifest(
      root,
      'policy.json',
      (v) =>
        (v.utilityGroups.find(
          (group: { entries: Record<string, unknown> }) => group.entries['source-probe'],
        ).entries['source-probe'].sourceGeometry.value = '53px'),
    );
    expect(await codes(root)).toContain('DS_MANIFEST');
  });

  test('geometry: 출처가 없거나 theme 연결이 다르거나 token과 geometry를 섞으면 거부한다', async () => {
    const root = await fixture();
    await geometryProbe(root);
    const policy = JSON.parse(await readFile(path.join(root, 'design/policy.json'), 'utf8'));
    const initial = policy.utilityGroups.find(
      (group: { entries: Record<string, unknown> }) => group.entries['source-probe'],
    ).entries['source-probe'];
    for (const change of [
      (entry: { sourceGeometry: { evidence: string } }) =>
        (entry.sourceGeometry.evidence = 'evidence/unpinned.json'),
      (entry: { theme: { value: string }[] }) => (entry.theme[0]!.value = '53px'),
      (entry: { tokens: string[] }) => entry.tokens.push('--color-blue-500'),
    ]) {
      await manifest(root, 'policy.json', (v) => {
        const group = v.utilityGroups.find(
          (entry: { entries: Record<string, unknown> }) => entry.entries['source-probe'],
        );
        group.entries['source-probe'] = structuredClone(initial);
        change(group.entries['source-probe']);
      });
      expect(await codes(root)).toContain('DS_MANIFEST');
    }
  });

  test('geometry: 기존 동작은 원본 snapshot의 파일·SHA와 evidence pin까지 일치해야 한다', async () => {
    const root = await fixture();
    const baseline = await checkDesign(root);
    expect(baseline.some((d) => d.code === 'DS_MANIFEST')).toBe(false);
    await geometryProbe(root, true);
    const before = new Set(baseline.map((d) => JSON.stringify(d)));
    expect((await checkDesign(root)).filter((d) => !before.has(JSON.stringify(d)))).toEqual([]);
    await put(root, 'design/evidence/geometry-before.txt', 'changed');
    expect(await codes(root)).toContain('DS_MANIFEST');
  });

  test('motion: 고정한 기존 모션만 허용하고 직접 duration·곡선·미등록 변수·타입 오용을 차단한다', async () => {
    const root = await fixture();
    const baseline = await checkDesign(root);
    expect(baseline.some((d) => d.code === 'DS_MANIFEST')).toBe(false);
    const { file, css } = await motionProbe(root);
    const before = new Set(baseline.map((d) => JSON.stringify(d)));
    expect((await checkDesign(root)).filter((d) => !before.has(JSON.stringify(d)))).toEqual([]);
    for (const [declaration, expected] of [
      ['transition-duration: 201ms;', 'DS_TOKEN_LITERAL'],
      ['transition-timing-function: cubic-bezier(0, 0, 0.2, 1);', 'DS_TOKEN_LITERAL'],
      ['transition-duration: var(--duration-unregistered);', 'DS_TOKEN_UNKNOWN'],
      ['transition-duration: var(--grid-source-probe);', 'DS_TOKEN_TYPE'],
      ['grid-template-rows: var(--duration-source-probe);', 'DS_TOKEN_TYPE'],
      ['transition-property: opacity;', 'DS_TOKEN_LITERAL'],
    ]) {
      await put(root, file, `${css}\n.invalid { ${declaration} }`);
      expect(await codes(root)).toContain(expected);
    }
    await put(root, file, `${css}\n@media (prefers-reduced-motion: no-preference) { .surface {} }`);
    expect(await codes(root)).toContain('DS_BREAKPOINT');
  }, 60_000);

  test('motion: 출처를 Figma 치수로 바꾸거나 모션 속성에 길이 단위를 넣으면 거부한다', async () => {
    const root = await fixture();
    await motionProbe(root);
    await manifest(root, 'policy.json', (value) => {
      value.utilityGroups.find(
        (group: { entries: Record<string, unknown> }) => group.entries['source-probe-duration'],
      ).entries['source-probe-duration'].sourceGeometry.value = '200px';
    });
    expect(await codes(root)).toContain('DS_MANIFEST');
    await manifest(root, 'policy.json', (value) => {
      value.utilityGroups.find(
        (group: { entries: Record<string, unknown> }) => group.entries['source-probe-duration'],
      ).entries['source-probe-duration'].sourceGeometry.value = '200ms';
    });
    const file = path.join(root, 'design/evidence/motion-probe.json');
    const evidence = JSON.parse(await readFile(file, 'utf8'));
    evidence.geometry[0].source = { kind: 'figma' };
    await writeFile(file, JSON.stringify(evidence));
    const sourceFile = path.join(root, 'design/source.json');
    const source = JSON.parse(await readFile(sourceFile, 'utf8'));
    source.evidence['evidence/motion-probe.json'] = hash(await readFile(file));
    await writeFile(sourceFile, JSON.stringify(source));
    expect(await codes(root)).toContain('DS_MANIFEST');
  });

  test('native: 닫힌 variant·size 조합과 variant 기본값을 함께 검사한다', async () => {
    const root = await fixture();
    await approvedNativeProbe(root);
    const source = await readFile(path.join(root, 'src/shared/ui/probe.tsx'), 'utf8');
    await put(
      root,
      'src/shared/ui/probe.tsx',
      source
        .replace(
          "{tone?:'primary'|'alert'}",
          "{tone?:'primary'|'alert';variant?:'primary'|'secondary'|'icon'|'link'|'text';size?:'L'|'M'|'S'|'XS'|'icon'}",
        )
        .replace(
          "{tone='primary',className,children,...props}",
          "{tone='primary',variant='primary',size,className,children,...props}",
        ),
    );
    await manifest(root, 'components.json', (v) => {
      const probe = v.approved.find((entry: { name: string }) => entry.name === 'Probe');
      probe.props = {
        ...probe.props,
        variant: ['primary', 'secondary', 'icon', 'link', 'text'],
        size: ['L', 'M', 'S', 'XS', 'icon'],
      };
      probe.defaultProps = { variant: 'primary' };
      probe.propCombinations = [
        { variant: ['primary', 'secondary'], size: ['L', 'M', 'S', 'XS'] },
        { variant: ['icon'], size: ['icon'] },
        { variant: ['link', 'text'], size: [] },
      ];
    });
    const valid = [
      'variant="primary" size="L"',
      'variant="icon" size="icon"',
      'variant="icon"',
      'variant="link"',
      'size="M"',
    ];
    await put(
      root,
      'app/probe/page.tsx',
      `import{Probe}from '@/shared/ui/probe';export default function Page(){return <>${valid.map((props) => `<Probe ${props}/>`).join('')}</>}`,
    );
    expect((await checkDesign(root)).filter((d) => d.file === 'app/probe/page.tsx')).toEqual([]);
    const invalid = ['variant="icon" size="L"', 'variant="link" size="S"', 'size="icon"'];
    await put(
      root,
      'app/probe/page.tsx',
      `import{Probe}from '@/shared/ui/probe';export default function Page(){return <>${invalid.map((props) => `<Probe ${props}/>`).join('\n')}</>}`,
    );
    expect(
      (await checkDesign(root)).filter(
        (d) => d.file === 'app/probe/page.tsx' && d.code === 'DS_PROP',
      ),
    ).toHaveLength(3);
  });

  test('native: 승인 CSS Module은 local backdrop/open만 허용하고 배치 caller는 외형을 받지 못한다', async () => {
    const root = await fixture();
    await approvedNativeProbe(root);
    await manifest(root, 'components.json', (v) =>
      v.approved
        .find((entry: { name: string }) => entry.name === 'Probe')
        .styles.push('src/shared/ui/probe.module.css'),
    );
    await put(
      root,
      'src/shared/ui/probe.module.css',
      '.surface { display: flex; } .surface[open] { display: flex; } .surface::backdrop { background: var(--color-brand-primary); }',
    );
    expect(
      (await checkDesign(root)).filter(
        (d) => d.file === 'src/shared/ui/probe.module.css' && d.code === 'DS_SELECTOR',
      ),
    ).toEqual([]);
    await put(
      root,
      'app/probe/page.tsx',
      `import{Probe}from '@/shared/ui/probe';import styles from '@/shared/ui/probe.module.css';export default function Page(){return <Probe className={styles.surface}/>}`,
    );
    expect(
      (await checkDesign(root)).filter((d) => d.file === 'app/probe/page.tsx').map((d) => d.code),
    ).toContain('DS_SCREEN_STYLE');
    const policy = JSON.parse(await readFile(path.join(root, 'design/policy.json'), 'utf8'));
    const breakpoint = Object.values(policy.breakpoints)[0];
    await put(
      root,
      'src/shared/ui/probe.module.css',
      `.surface { display: flex; } @media (min-width: ${breakpoint}) { .surface { background: var(--color-brand-primary); } }`,
    );
    expect(
      (await checkDesign(root)).filter((d) => d.file === 'app/probe/page.tsx').map((d) => d.code),
    ).toContain('DS_SCREEN_STYLE');
    await put(
      root,
      'src/shared/ui/probe.module.css',
      '.surface button { display: flex; } body { display: flex; } :global(.surface) { display: flex; }',
    );
    expect(
      (await checkDesign(root)).filter(
        (d) => d.file === 'src/shared/ui/probe.module.css' && d.code === 'DS_SELECTOR',
      ),
    ).toHaveLength(3);
  });

  test('native: 접미사 없는 원본 utility도 외형 역할을 유지하고 pinned helper rest는 중립으로 해석한다', async () => {
    const root = await fixture();
    await approvedNativeProbe(root);
    await manifest(root, 'policy.json', (v) => {
      if (
        !v.utilityGroups.some(
          (group: { prefixes: string[]; entries: Record<string, unknown> }) =>
            group.prefixes.includes('underline') && Object.hasOwn(group.entries, ''),
        )
      )
        v.utilityGroups.push({
          prefixes: ['underline'],
          role: 'appearance',
          entries: { '': { tokens: ['--font-size-14'], theme: [] } },
        });
    });
    await put(
      root,
      'app/probe/page.tsx',
      `import{Probe}from '@/shared/ui/probe';export default function Page(){return <Probe className="underline"/>}`,
    );
    const diagnostics = await checkDesign(root);
    expect(diagnostics.filter((d) => d.file === 'app/probe/page.tsx').map((d) => d.code)).toContain(
      'DS_SCREEN_STYLE',
    );
    expect(
      diagnostics.filter((d) => d.file === 'app/probe/page.tsx').map((d) => d.code),
    ).not.toContain('DS_TOKEN_UNKNOWN');
    expect(
      diagnostics.filter(
        (d) => d.file === 'src/shared/lib/utils.ts' && d.code === 'DS_CLASS_DYNAMIC',
      ),
    ).toEqual([]);
  });

  test('native: 외부 배치는 보존하고 Button의 높이·padding·간격·내부 흐름 덮어쓰기는 거부한다', async () => {
    const root = await fixture();
    await approvedNativeProbe(root);
    await put(
      root,
      'src/widgets/probe/ui/placement.module.css',
      '.placement { margin-bottom: var(--spacing); width: auto; flex-shrink: 0; }',
    );
    await put(
      root,
      'app/probe/page.tsx',
      `import{Probe}from '@/shared/ui/probe';import styles from '@/widgets/probe/ui/placement.module.css';export default function Page(){return <><Probe className="w-auto mb-2 shrink-0"/><Probe className={styles.placement}/></>}`,
    );
    expect((await checkDesign(root)).filter((d) => d.file === 'app/probe/page.tsx')).toEqual([]);
    await put(
      root,
      'src/widgets/probe/ui/placement.module.css',
      '.placement { padding: var(--spacing); height: var(--spacing); }',
    );
    await put(
      root,
      'app/probe/page.tsx',
      `import{Probe}from '@/shared/ui/probe';import styles from '@/widgets/probe/ui/placement.module.css';export default function Page(){return <><Probe className="h-1 px-1 gap-1 flex-col"/>
<Probe className={styles.placement}/></>}`,
    );
    expect(
      (await checkDesign(root)).filter(
        (d) => d.file === 'app/probe/page.tsx' && d.code === 'DS_SCREEN_STYLE',
      ),
    ).toHaveLength(6);
  });
});
