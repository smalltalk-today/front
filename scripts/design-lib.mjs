import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const manifestNames = ['tokens.json', 'components.json', 'policy.json', 'legacy.json'];
export const hash = (value) => createHash('sha256').update(value).digest('hex');
export const safeFile = (value) =>
  typeof value === 'string' &&
  value.length > 0 &&
  !path.isAbsolute(value) &&
  !value.includes('\\') &&
  !value.split('/').some((part) => !part || part === '..' || part === '.');

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

export async function readDesign(root) {
  const source = JSON.parse(await readFile(path.join(root, 'design/source.json'), 'utf8'));
  requireValue(source.version === 1, 'source.json: version 1이 필요합니다.');
  const result = { source };
  for (const name of manifestNames) {
    const bytes = await readFile(path.join(root, 'design', name));
    requireValue(source.files?.[name] === hash(bytes), `${name}: 기준 명세 해시 불일치`);
    const value = JSON.parse(bytes);
    requireValue(value.version === 1, `${name}: version 1이 필요합니다.`);
    result[name.slice(0, -5)] = value;
  }
  requireValue(
    source.evidence && Object.keys(source.evidence).length > 0,
    '원본 근거가 필요합니다.',
  );
  for (const [name, expected] of Object.entries(source.evidence)) {
    requireValue(safeFile(name) && /^[a-f0-9]{64}$/.test(expected), '잘못된 원본 근거 경로/해시');
    requireValue(
      hash(await readFile(path.join(root, 'design', name))) === expected,
      `${name}: 원본 근거 변경`,
    );
  }
  const original = JSON.parse(
    await readFile(path.join(root, 'design/reference/tokens.json'), 'utf8'),
  );
  requireValue(
    JSON.stringify(result.tokens.tokens) === JSON.stringify(original.tokens),
    '원본 토큰의 값·별칭·출처·개수를 변경할 수 없습니다.',
  );
  const tokenMap = new Map();
  const names = new Set();
  requireValue(
    Array.isArray(result.tokens.tokens) && result.tokens.tokens.length > 0,
    '토큰 목록이 필요합니다.',
  );
  for (const token of result.tokens.tokens) {
    requireValue(
      /^--[a-z][a-z0-9-]*$/.test(token.css) && !tokenMap.has(token.css) && !names.has(token.name),
      '토큰 이름 중복 또는 잘못된 CSS 이름',
    );
    requireValue(
      ['color', 'dimension', 'number', 'fontFamily', 'shadow'].includes(token.type),
      '토큰 타입 오류',
    );
    requireValue(token.source?.pageId && token.source?.path, `${token.css}: 원본 출처 누락`);
    requireValue(
      (token.value === undefined) !== (token.alias === undefined),
      `${token.css}: value/alias 중 하나만 필요`,
    );
    requireValue(
      token.value === undefined ||
        (token.type === 'number'
          ? typeof token.value === 'number' && Number.isFinite(token.value)
          : typeof token.value === 'string'),
      `${token.css}: 값 타입 오류`,
    );
    requireValue(
      typeof token.value !== 'string' || !/[;{}\r\n]/.test(token.value),
      '토큰에 CSS 선언 사용 금지',
    );
    requireValue(
      token.alpha === undefined ||
        (token.type === 'color' &&
          token.alias &&
          typeof token.alpha === 'number' &&
          token.alpha >= 0 &&
          token.alpha <= 1),
      '잘못된 alpha',
    );
    tokenMap.set(token.css, token);
    names.add(token.name);
  }
  function resolve(name, seen = new Set()) {
    const token = tokenMap.get(name);
    requireValue(token && !seen.has(name), `${name}: 미등록 별칭 또는 순환`);
    if (!token.alias) return token.value;
    requireValue(tokenMap.get(token.alias)?.type === token.type, `${name}: 별칭 타입 불일치`);
    return resolve(token.alias, new Set([...seen, name]));
  }
  for (const token of tokenMap.values()) resolve(token.css);
  const { policy, components, legacy } = result;
  requireValue(
    Array.isArray(policy.utilityGroups) &&
      Array.isArray(policy.structures) &&
      policy.breakpoints &&
      Array.isArray(policy.variants),
    'utility 정책 목록이 필요합니다.',
  );
  const utilities = {};
  for (const group of policy.utilityGroups) {
    requireValue(
      Array.isArray(group.prefixes) &&
        group.prefixes.every((prefix) => /^[a-z][a-z-]*$/.test(prefix)) &&
        group.entries &&
        ['layout', 'text', 'appearance'].includes(group.role),
      'utility 그룹 오류',
    );
    for (const prefix of group.prefixes)
      for (const [name, entry] of Object.entries(group.entries)) {
        const key = name ? `${prefix}-${name}` : prefix;
        requireValue(!utilities[key], `${key}: utility 중복`);
        utilities[key] = { ...entry, role: group.roleByPrefix?.[prefix] ?? group.role };
      }
  }
  policy.utilities = utilities;
  const geometryDocuments = new Map();
  const motionValues = {
    'transition-duration': /^\d+(?:\.\d+)?ms$/,
    'grid-template-rows': /^(?:0|1)fr$/,
    rotate: /^(?:0|180)deg$/,
    'transition-timing-function': /^cubic-bezier\(0, 0, 0\.2, 1\)$/,
  };
  async function validateGeometry(name, entry) {
    const geometry = entry.sourceGeometry;
    requireValue(
      geometry &&
        /^\d+:\d+$/.test(geometry.nodeId ?? '') &&
        typeof geometry.property === 'string' &&
        geometry.property &&
        typeof geometry.value === 'string' &&
        (Object.hasOwn(motionValues, geometry.property)
          ? motionValues[geometry.property].test(geometry.value)
          : /^-?\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|dvh|dvw)?$/.test(geometry.value)) &&
        safeFile(geometry.evidence) &&
        geometry.evidence.startsWith('evidence/') &&
        geometry.evidence.endsWith('.json') &&
        Object.hasOwn(source.evidence, geometry.evidence),
      `${name}: 고정한 원본 geometry 출처가 필요합니다.`,
    );
    if (!geometryDocuments.has(geometry.evidence))
      geometryDocuments.set(
        geometry.evidence,
        JSON.parse(await readFile(path.join(root, 'design', geometry.evidence), 'utf8')),
      );
    const document = geometryDocuments.get(geometry.evidence);
    requireValue(
      document.version === 1 && Array.isArray(document.geometry),
      `${name}: geometry 원본 문서 형식 오류`,
    );
    const matching = document.geometry.filter(
      (item) =>
        item.nodeId === geometry.nodeId &&
        item.property === geometry.property &&
        item.value === geometry.value &&
        JSON.stringify(item.theme) === JSON.stringify(entry.theme),
    );
    requireValue(
      matching.length === 1,
      `${name}: 원본 geometry의 node/property/value/theme가 일치하지 않습니다.`,
    );
    const provenance = matching[0].source;
    requireValue(
      provenance && ['figma', 'existing-code'].includes(provenance.kind),
      `${name}: geometry provenance가 필요합니다.`,
    );
    if (Object.hasOwn(motionValues, geometry.property))
      requireValue(
        provenance.kind === 'existing-code' &&
          entry.theme.length === 1 &&
          entry.theme[0].value === geometry.value,
        `${name}: 모션 값은 고정한 기존 동작의 값과 정확히 일치해야 합니다.`,
      );
    if (provenance.kind === 'existing-code') {
      requireValue(
        safeFile(provenance.file) &&
          provenance.file.startsWith('design/evidence/') &&
          /^[a-f0-9]{64}$/.test(provenance.sha256 ?? '') &&
          source.evidence[provenance.file.slice('design/'.length)] === provenance.sha256,
        `${name}: 기존 동작의 원본 snapshot 경로와 고정 해시가 필요합니다.`,
      );
      requireValue(
        hash(await readFile(path.join(root, provenance.file))) === provenance.sha256,
        `${name}: 기존 동작의 원본 snapshot이 변경됐습니다.`,
      );
    }
  }
  for (const [name, entry] of Object.entries(policy.utilities)) {
    requireValue(
      name &&
        !/[\s\[\]{}]/.test(name) &&
        Array.isArray(entry.tokens) &&
        ((entry.tokens.length > 0 && entry.sourceGeometry === undefined) ||
          (entry.tokens.length === 0 && entry.sourceGeometry)) &&
        entry.tokens.every((key) => tokenMap.has(key)),
      `${name}: 원본 토큰 연결 누락`,
    );
    requireValue(
      ['layout', 'text', 'appearance'].includes(entry.role),
      `${name}: utility 역할 오류`,
    );
    requireValue(
      Array.isArray(entry.theme) &&
        entry.theme.every(
          (item) =>
            safeFile(item.file) && item.variable.startsWith('--') && typeof item.value === 'string',
        ),
      `${name}: 실제 theme 연결 누락`,
    );
    if (entry.sourceGeometry) await validateGeometry(name, entry);
  }
  requireValue(
    Array.isArray(components.approved) && Array.isArray(components.pending),
    'approved/pending 컴포넌트 목록이 필요합니다.',
  );
  requireValue(
    Array.isArray(policy.providers ?? []) &&
      (policy.providers ?? []).every(
        (provider) =>
          /^(?:@[a-z0-9-]+\/)?[a-z0-9-]+$/.test(provider.module) &&
          Array.isArray(provider.exports) &&
          provider.exports.every((name) => /^[A-Z][A-Za-z0-9]*$/.test(name)),
      ),
    '비시각 provider의 패키지와 named export 목록이 필요합니다.',
  );
  const componentKeys = new Set();
  for (const component of components.approved) {
    const key = `${component.file}#${component.name}`;
    requireValue(
      safeFile(component.file) &&
        /^(app|src)\//.test(component.file) &&
        component.name &&
        !componentKeys.has(key) &&
        /^\d+:\d+$/.test(component.source?.nodeId ?? ''),
      '승인 컴포넌트의 경로·이름·출처 오류',
    );
    requireValue(
      Array.isArray(component.allowedProps) &&
        component.props &&
        typeof component.props === 'object',
      '승인 props 계약이 필요합니다.',
    );
    requireValue(
      component.nativeTag === undefined || ['button', 'input'].includes(component.nativeTag),
      'nativeTag는 검증 가능한 button/input만 허용합니다.',
    );
    requireValue(
      component.layoutProps === undefined ||
        (Array.isArray(component.layoutProps) &&
          component.layoutProps.length === 1 &&
          component.layoutProps[0] === 'className' &&
          component.allowedProps.includes('className')),
      'layoutProps는 승인한 className 하나만 허용합니다.',
    );
    const visualProps = new Set([
      'variant',
      'size',
      'tone',
      'color',
      'state',
      'appearance',
      'shape',
      'radius',
      'weight',
      'intent',
      'theme',
      'selected',
      'active',
    ]);
    requireValue(
      component.allowedProps.every(
        (name) =>
          typeof name === 'string' &&
          (!visualProps.has(name) || Object.hasOwn(component.props, name)),
      ),
      '시각 props에는 닫힌 허용값 목록이 필요합니다.',
    );
    requireValue(
      Array.isArray(component.styles ?? []) &&
        (component.styles ?? []).every(
          (file) =>
            safeFile(file) && /^(app|src)\//.test(file) && /\.(?:css|[cm]?[jt]s)$/.test(file),
        ),
      '컴포넌트 소유 style 모듈 경로 오류',
    );
    for (const [name, values] of Object.entries(component.props)) {
      requireValue(
        name &&
          Array.isArray(values) &&
          values.length > 0 &&
          values.every((v) => ['string', 'boolean', 'number'].includes(typeof v)),
        'props 허용값 오류',
      );
    }
    requireValue(
      component.defaultProps === undefined ||
        (component.defaultProps &&
          !Array.isArray(component.defaultProps) &&
          Object.entries(component.defaultProps).every(([name, value]) =>
            component.props[name]?.includes(value),
          )),
      '기본 props는 승인한 enum 값이어야 합니다.',
    );
    requireValue(
      component.propCombinations === undefined ||
        (Array.isArray(component.propCombinations) &&
          component.propCombinations.length > 0 &&
          component.propCombinations.every(
            (combination) =>
              combination &&
              !Array.isArray(combination) &&
              Object.keys(combination).length > 0 &&
              Object.entries(combination).every(
                ([name, values]) =>
                  Object.hasOwn(component.props, name) &&
                  Array.isArray(values) &&
                  values.every((value) => component.props[name].includes(value)),
              ),
          )),
      'props 조합은 승인한 enum의 닫힌 부분집합이어야 합니다.',
    );
    componentKeys.add(key);
  }
  requireValue(Array.isArray(legacy.entries), '기존 위반 목록이 필요합니다.');
  const legacyFiles = new Set();
  for (const entry of legacy.entries) {
    requireValue(
      safeFile(entry.file) &&
        /^(app|src)\//.test(entry.file) &&
        /^[a-f0-9]{64}$/.test(entry.sha256) &&
        entry.reason &&
        entry.removalStage &&
        Array.isArray(entry.diagnostics) &&
        entry.diagnostics.length > 0 &&
        !legacyFiles.has(entry.file),
      '기존 위반의 파일·해시·진단·해소 단계가 필요합니다.',
    );
    requireValue(
      entry.diagnostics.every(
        (d) =>
          /^DS_[A-Z_]+$/.test(d.code) &&
          Number.isInteger(d.line) &&
          d.line > 0 &&
          typeof d.message === 'string',
      ),
      '기존 진단 형식 오류',
    );
    legacyFiles.add(entry.file);
  }
  requireValue(
    Array.isArray(policy.assets) &&
      policy.font &&
      safeFile(policy.font.file) &&
      safeFile(policy.font.module),
    '폰트·에셋 정책이 필요합니다.',
  );
  for (const asset of [...policy.assets, { file: policy.font.file, sha256: policy.font.sha256 }]) {
    requireValue(
      safeFile(asset.file) && /^[a-f0-9]{64}$/.test(asset.sha256),
      '에셋 경로/해시 오류',
    );
    requireValue(
      hash(await readFile(path.join(root, asset.file))) === asset.sha256,
      `${asset.file}: 에셋/폰트 변경`,
    );
    if (asset.status === 'approved')
      requireValue(
        asset.file.startsWith('public/') &&
          asset.url === `/${asset.file.slice(7)}` &&
          /^\d+:\d+$/.test(asset.source?.nodeId ?? ''),
        'UI 에셋에는 public 경로·URL·원본 node ID가 필요합니다.',
      );
  }
  requireValue(
    hash(await readFile(path.join(root, policy.font.module))) === policy.font.moduleSha256,
    '로컬 폰트 호출 옵션 변경',
  );
  requireValue(Array.isArray(policy.helpers), '검증된 클래스 helper 목록이 필요합니다.');
  for (const helper of policy.helpers) {
    requireValue(
      safeFile(helper.file) && helper.name && /^[a-f0-9]{64}$/.test(helper.sha256),
      '클래스 helper 경로/해시 오류',
    );
    requireValue(
      hash(await readFile(path.join(root, helper.file))) === helper.sha256,
      `${helper.file}: 클래스 helper 변경`,
    );
  }
  return { ...result, tokenMap, resolve };
}
