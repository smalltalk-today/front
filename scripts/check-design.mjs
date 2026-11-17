import { readdir, readFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import { hash, readDesign } from './design-lib.mjs';

const structuralTags = new Set([
  'html',
  'body',
  'main',
  'section',
  'div',
  'span',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'article',
  'header',
  'footer',
  'nav',
  'aside',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  'br',
  'strong',
  'em',
  'small',
]);
const textTags = new Set([
  'span',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'em',
  'small',
  'dt',
  'dd',
  'li',
]);
const layoutProperty =
  /^(display|position|inset(?:-.+)?|top|right|bottom|left|z-index|width|min-width|max-width|height|min-height|max-height|margin(?:-.+)?|padding(?:-.+)?|gap|row-gap|column-gap|flex(?:-.+)?|align-(?:items|content|self)|justify-(?:items|content|self)|place-(?:items|content|self)|grid(?:-.+)?|order|overflow(?:-[xy])?|box-sizing|isolation|contain|container-type|container-name)$/;
const exteriorProperty =
  /^(position|inset(?:-(?:inline|block)(?:-(?:start|end))?)?|top|right|bottom|left|z-index|width|min-width|max-width|margin(?:-(?:top|right|bottom|left|inline|block|inline-start|inline-end|block-start|block-end))?|flex-grow|flex-shrink|flex-basis|order|align-self)$/;
const exteriorUtility =
  /^(?:m|mt|mr|mb|ml|mx|my|ms|me|w|min-w|max-w|inset|inset-x|inset-y|top|right|bottom|left|z|basis|grow|shrink|order|self)-/;
const exteriorStructures = new Set([
  'relative',
  'absolute',
  'fixed',
  'sticky',
  'static',
  'flex-1',
  'grow',
  'shrink',
]);
const structuralValues = new Set([
  '0',
  'auto',
  'none',
  'normal',
  'inherit',
  'initial',
  'unset',
  'revert',
  'transparent',
  'currentColor',
  'flex',
  'inline-flex',
  'grid',
  'block',
  'inline',
  'inline-block',
  'contents',
  'hidden',
  'visible',
  'scroll',
  'clip',
  'relative',
  'absolute',
  'fixed',
  'sticky',
  'static',
  'row',
  'column',
  'wrap',
  'nowrap',
  'center',
  'start',
  'end',
  'flex-start',
  'flex-end',
  'space-between',
  'space-around',
  'space-evenly',
  'stretch',
  'baseline',
  'border-box',
  'content-box',
  '100%',
  'min-content',
  'max-content',
  'fit-content',
  'subgrid',
  'dense',
]);
const factoryNames = new Set(['createElement', 'cloneElement', 'jsx', 'jsxs', 'jsxDEV']);

async function filesUnder(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink())
      throw new Error(`심볼릭 링크는 검사할 수 없습니다: ${path.join(dir, entry.name)}`);
    if (entry.isDirectory()) result.push(...(await filesUnder(path.join(dir, entry.name))));
    else result.push(path.join(dir, entry.name));
  }
  return result;
}

function unwrap(node) {
  while (
    node &&
    (ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isNonNullExpression(node))
  )
    node = node.expression;
  return node;
}

function containsJsx(node) {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node))
    return true;
  let result = false;
  ts.forEachChild(node, (child) => {
    if (containsJsx(child)) result = true;
  });
  return result;
}

export async function checkDesign(root, { includeLegacy = false } = {}) {
  root = path.resolve(root);
  const diagnostics = [];
  const report = (code, file, line, message) =>
    diagnostics.push({ code, file, line: line || 1, message });
  let design;
  try {
    design = await readDesign(root);
  } catch (error) {
    report('DS_MANIFEST', 'design/source.json', 1, error.message);
    return diagnostics;
  }
  const normalized = (name) => {
    const full = path.resolve(name).split(path.sep).join('/');
    const marker = '/node_modules/';
    return full.includes(marker)
      ? `node_modules/${full.slice(full.lastIndexOf(marker) + marker.length)}`
      : path.relative(root, full).split(path.sep).join('/');
  };
  let allFiles;
  try {
    allFiles = (
      await Promise.all(['app', 'src'].map((dir) => filesUnder(path.join(root, dir))))
    ).flat();
  } catch (error) {
    report('DS_SOURCE', 'app/src', 1, error.message);
    return diagnostics;
  }
  const cssFiles = allFiles.filter((file) => file.endsWith('.css'));
  const codeFiles = allFiles.filter((file) => /\.[cm]?[jt]sx?$/.test(file));
  const cssTrees = new Map();
  for (const file of cssFiles) {
    try {
      cssTrees.set(normalized(file), postcss.parse(await readFile(file, 'utf8'), { from: file }));
    } catch (error) {
      report('DS_PARSE', normalized(file), error.line, error.reason || error.message);
    }
  }
  const themeVariables = new Map();
  for (const [file, tree] of cssTrees)
    tree.walkDecls((d) => {
      if (d.prop.startsWith('--')) {
        const key = `${file}#${d.prop}`;
        if (themeVariables.has(key))
          report('DS_THEME_DUPLICATE', file, d.source.start.line, `중복 변수 선언: ${d.prop}`);
        themeVariables.set(key, d.value);
      }
    });
  for (const [name, entry] of Object.entries(design.policy.utilities)) {
    for (const theme of entry.theme) {
      if (themeVariables.get(`${theme.file}#${theme.variable}`) !== theme.value)
        report(
          'DS_TOKEN_DRIFT',
          theme.file,
          1,
          `${name}: 승인한 theme 변수와 다릅니다: ${theme.variable}`,
        );
    }
  }
  let options = {
    allowJs: true,
    noEmit: true,
    jsx: ts.JsxEmit.Preserve,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    baseUrl: root,
    paths: { '@/*': ['src/*'] },
  };
  const configPath = path.join(root, 'tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (!config.error)
    options = { ...options, ...ts.parseJsonConfigFileContent(config.config, ts.sys, root).options };
  // Next can compile JS/JSX even when the project's TypeScript check excludes it.
  options.allowJs = true;
  const program = ts.createProgram(codeFiles, options);
  const checker = program.getTypeChecker();
  const approved = new Map(
    design.components.approved.map((entry) => [`${entry.file}#${entry.name}`, entry]),
  );
  const componentFiles = new Set(design.components.approved.map((entry) => entry.file));
  const approvedFiles = new Set(
    design.components.approved.flatMap((entry) => [entry.file, ...(entry.styles ?? [])]),
  );
  const uiAssets = new Set(
    design.policy.assets.filter((asset) => asset.status === 'approved').map((asset) => asset.url),
  );
  const sourceSet = new Set(codeFiles);
  const structures = new Set(design.policy.structures);
  const variants = new Set([...design.policy.variants, ...Object.keys(design.policy.breakpoints)]);
  const legacyByFile = new Map(design.legacy.entries.map((entry) => [entry.file, entry]));
  const sourceHashes = new Map();
  for (const file of allFiles)
    if (/\.(?:[cm]?[jt]sx?|css)$/.test(file))
      sourceHashes.set(normalized(file), hash(await readFile(file)));
  for (const entry of design.legacy.entries) {
    if (sourceHashes.get(entry.file) !== entry.sha256)
      report(
        'DS_LEGACY_DRIFT',
        entry.file,
        1,
        '보존한 기존 위반 파일이 변경됐습니다. 원본 대조·이관 후 예외를 제거하세요.',
      );
  }
  let publicFiles = [];
  try {
    publicFiles = await filesUnder(path.join(root, 'public'));
  } catch (error) {
    if (error.code !== 'ENOENT') report('DS_SOURCE', 'public', 1, error.message);
  }
  const assetFiles = new Set([
    ...design.policy.assets.map((asset) => asset.file),
    design.policy.font.file,
  ]);
  for (const file of [...allFiles, ...publicFiles]) {
    if (
      /\.(svg|png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf)$/i.test(file) &&
      !assetFiles.has(normalized(file))
    )
      report('DS_ASSET_UNKNOWN', normalized(file), 1, '원본 확인과 등록이 필요한 새 에셋입니다.');
  }
  for (const syntax of program.getSyntacticDiagnostics()) {
    if (syntax.file && sourceSet.has(syntax.file.fileName))
      report(
        'DS_PARSE',
        normalized(syntax.file.fileName),
        syntax.file.getLineAndCharacterOfPosition(syntax.start ?? 0).line + 1,
        ts.flattenDiagnosticMessageText(syntax.messageText, ' '),
      );
  }
  const symbolOf = (node) => {
    let symbol = checker.getSymbolAtLocation(node);
    const seen = new Set();
    while (symbol && symbol.flags & ts.SymbolFlags.Alias && !seen.has(symbol)) {
      seen.add(symbol);
      symbol = checker.getAliasedSymbol(symbol);
    }
    return symbol;
  };
  const declarationOf = (node) =>
    symbolOf(node)?.valueDeclaration ?? symbolOf(node)?.declarations?.[0];
  const rawImport = (node) => {
    const declarations = checker.getSymbolAtLocation(node)?.declarations ?? [];
    for (const declaration of declarations) {
      let parent = declaration;
      while (parent && !ts.isImportDeclaration(parent)) parent = parent.parent;
      if (parent && ts.isStringLiteral(parent.moduleSpecifier)) return parent;
    }
    return null;
  };
  const sourceIdentity = (node) => {
    const symbol = symbolOf(node),
      declaration = declarationOf(node);
    return declaration
      ? { name: symbol?.name, file: normalized(declaration.getSourceFile().fileName), declaration }
      : null;
  };
  const importedName = (node) => {
    const declaration = declarationOf(node);
    if (declaration && ts.isImportSpecifier(declaration))
      return declaration.propertyName?.text ?? declaration.name.text;
    return symbolOf(node)?.name;
  };
  const dynamicFactoryTarget = (node, seen = new Set()) => {
    const expression = unwrap(node);
    if (!expression || seen.has(expression)) return false;
    const imported = rawImport(expression);
    if (
      imported &&
      ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'].includes(
        imported.moduleSpecifier.text,
      )
    )
      return true;
    if (ts.isIdentifier(expression) && ['document', 'window'].includes(expression.text))
      return true;
    const declaration = declarationOf(expression);
    return Boolean(
      declaration &&
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer &&
      dynamicFactoryTarget(declaration.initializer, new Set([...seen, expression])),
    );
  };
  const helperKind = (node, seen = new Set()) => {
    const identity = sourceIdentity(node);
    if (!identity || seen.has(identity.declaration)) return null;
    if (
      identity.file.startsWith('node_modules/class-variance-authority/') &&
      identity.name === 'cva'
    )
      return 'cva';
    if (identity.file.startsWith('node_modules/clsx/')) return 'clsx';
    if (
      design.policy.helpers?.some(
        (helper) => helper.file === identity.file && helper.name === identity.name,
      )
    )
      return 'cn';
    const declaration = identity.declaration;
    if (
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer &&
      declaration.parent.flags & ts.NodeFlags.Const
    )
      return helperKind(unwrap(declaration.initializer), new Set([...seen, declaration]));
    return null;
  };
  const cvaDeclaration = (node) => {
    const declaration = declarationOf(node);
    return declaration &&
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer &&
      ts.isCallExpression(unwrap(declaration.initializer)) &&
      helperKind(unwrap(declaration.initializer).expression) === 'cva'
      ? unwrap(declaration.initializer)
      : null;
  };
  function isComposition(file, declaration) {
    if (/^src\/widgets\/[^/]+\/ui\//.test(file)) return true;
    if (
      design.policy.infrastructure?.some(
        (entry) => entry.file === file && entry.exports.includes(declaration.name?.text),
      )
    )
      return true;
    return (
      /^app\/(?:.*\/)?(?:page|layout|template|loading|error|global-error|not-found|default)\.[jt]sx?$/.test(
        file,
      ) && declaration.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
    );
  }
  const isStyleFactory = (node) => {
    const call = unwrap(node);
    if (!call || !ts.isCallExpression(call)) return false;
    return Boolean(helperKind(call.expression));
  };
  const moduleClassMarkers = new Set();
  const mutated = new Set();
  function markMutable(input, seen = new Set()) {
    let node = unwrap(input);
    while (node && (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)))
      node = unwrap(node.expression);
    const symbol = node && symbolOf(node);
    if (!symbol || seen.has(symbol)) return;
    mutated.add(symbol);
    const declaration = symbol.valueDeclaration;
    if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer)
      markMutable(declaration.initializer, new Set([...seen, symbol]));
  }
  for (const source of program.getSourceFiles())
    if (sourceSet.has(source.fileName)) {
      const inspectMutation = (node) => {
        if (
          ts.isBinaryExpression(node) &&
          node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
          node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
        )
          markMutable(node.left);
        if (
          ts.isPostfixUnaryExpression(node) ||
          (ts.isPrefixUnaryExpression(node) &&
            [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator))
        )
          markMutable(node.operand);
        if (ts.isDeleteExpression(node)) markMutable(node.expression);
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          [
            'push',
            'pop',
            'shift',
            'unshift',
            'splice',
            'sort',
            'reverse',
            'fill',
            'copyWithin',
            'set',
          ].includes(node.expression.name.text)
        )
          markMutable(node.expression.expression);
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.expression.getText() === 'Object' &&
          ['assign', 'defineProperty', 'defineProperties'].includes(node.expression.name.text)
        )
          markMutable(node.arguments[0]);
        ts.forEachChild(node, inspectMutation);
      };
      inspectMutation(source);
    }
  const constantInitializer = (input) => {
    const declaration = declarationOf(input);
    if (mutated.has(symbolOf(input)))
      throw new Error('변경 가능한 클래스 상수는 허용하지 않습니다.');
    return declaration &&
      ts.isVariableDeclaration(declaration) &&
      declaration.parent.flags & ts.NodeFlags.Const
      ? unwrap(declaration.initializer)
      : null;
  };
  const unsafeNativeProps = new Set([
    'style',
    'className',
    'dangerouslySetInnerHTML',
    'css',
    'sx',
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
  function functionContract(node) {
    let owner = node.parent;
    while (owner && !ts.isFunctionLike(owner)) owner = owner.parent;
    if (!owner) return null;
    const name =
      owner.name?.text ??
      (ts.isVariableDeclaration(owner.parent) ? owner.parent.name.getText() : null);
    const contract = name && approved.get(`${normalized(owner.getSourceFile().fileName)}#${name}`);
    return contract ? { owner, contract } : null;
  }
  function layoutBinding(node) {
    if (!ts.isIdentifier(node) || mutated.has(symbolOf(node))) return null;
    const declaration = declarationOf(node);
    if (
      !declaration ||
      !ts.isBindingElement(declaration) ||
      declaration.dotDotDotToken ||
      declaration.initializer ||
      !ts.isObjectBindingPattern(declaration.parent) ||
      !ts.isParameter(declaration.parent.parent)
    )
      return null;
    const parameter = declaration.parent.parent;
    const owned = functionContract(declaration);
    const key =
      declaration.propertyName?.getText().replace(/^['"]|['"]$/g, '') ?? declaration.name.getText();
    if (
      !owned ||
      parameter.parent !== owned.owner ||
      key !== 'className' ||
      !owned.contract.layoutProps?.includes(key)
    )
      return null;
    const type = checker.getTypeAtLocation(node);
    const members = type.isUnion() ? type.types : [type];
    return members.every(
      (member) => member.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.Undefined),
    )
      ? declaration
      : null;
  }
  function helperRestBinding(node) {
    if (!ts.isIdentifier(node) || mutated.has(symbolOf(node))) return false;
    const parameter = declarationOf(node);
    if (!parameter || !ts.isParameter(parameter) || !parameter.dotDotDotToken) return false;
    const owner = parameter.parent;
    const name =
      owner.name?.text ??
      (ts.isVariableDeclaration(owner.parent) ? owner.parent.name.getText() : null);
    return design.policy.helpers.some(
      (helper) => helper.file === normalized(node.getSourceFile().fileName) && helper.name === name,
    );
  }
  function intrinsicType(tag, location) {
    const symbol = checker.getJsxIntrinsicTagNamesAt(location).find((entry) => entry.name === tag);
    return symbol && checker.getTypeOfSymbolAtLocation(symbol, location);
  }
  function safeNativeAttribute(contract, name, location) {
    if (!contract.nativeTag || unsafeNativeProps.has(name) || Object.hasOwn(contract.props, name))
      return false;
    const type = intrinsicType(contract.nativeTag, location);
    return Boolean(type && checker.getPropertyOfType(type, name));
  }
  function safeNativeSpread(attribute, tag) {
    const expression = unwrap(attribute.expression);
    if (!expression || !ts.isIdentifier(expression) || mutated.has(symbolOf(expression)))
      return false;
    const declaration = declarationOf(expression);
    if (
      !declaration ||
      !ts.isBindingElement(declaration) ||
      !declaration.dotDotDotToken ||
      !ts.isObjectBindingPattern(declaration.parent) ||
      !ts.isParameter(declaration.parent.parent)
    )
      return false;
    const parameter = declaration.parent.parent;
    const owned = functionContract(declaration);
    if (
      !parameter.type ||
      !owned ||
      parameter.parent !== owned.owner ||
      owned.contract.nativeTag !== tag
    )
      return false;
    const nativeType = intrinsicType(tag, attribute);
    if (!nativeType) return false;
    const type = checker.getTypeAtLocation(expression);
    const members = type.isUnion() ? type.types : [type];
    return members.every((member) => {
      if (
        member.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown) ||
        checker.getIndexInfosOfType(member).length
      )
        return false;
      return checker.getPropertiesOfType(member).every((property) => {
        const name = property.name;
        if (unsafeNativeProps.has(name) || Object.hasOwn(owned.contract.props, name)) return false;
        const nativeProperty = checker.getPropertyOfType(nativeType, name);
        if (!nativeProperty) return false;
        const propertyType = checker.getTypeOfSymbolAtLocation(property, attribute);
        const nativePropertyType = checker.getTypeOfSymbolAtLocation(nativeProperty, attribute);
        const nativeAny =
          propertyType.flags & ts.TypeFlags.Any && nativePropertyType.flags & ts.TypeFlags.Any;
        return (
          (!(propertyType.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) || nativeAny) &&
          checker.isTypeAssignableTo(propertyType, nativePropertyType)
        );
      });
    });
  }
  function staticClasses(input, seen = new Set()) {
    const node = unwrap(input);
    if (!node) return [];
    if (ts.isStringLiteralLike(node)) return [node.text];
    if (layoutBinding(node) || helperRestBinding(node)) return [''];
    if (
      [ts.SyntaxKind.NullKeyword, ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(
        node.kind,
      )
    )
      return [];
    if (ts.isIdentifier(node) && node.text === 'undefined') return [];
    if (ts.isArrayLiteralExpression(node))
      return node.elements.flatMap((e) =>
        staticClasses(ts.isSpreadElement(e) ? e.expression : e, seen),
      );
    if (ts.isConditionalExpression(node))
      return [...staticClasses(node.whenTrue, seen), ...staticClasses(node.whenFalse, seen)];
    if (ts.isBinaryExpression(node)) {
      if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken)
        return staticClasses(node.right, seen);
      if (
        [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(
          node.operatorToken.kind,
        )
      )
        return [...staticClasses(node.left, seen), ...staticClasses(node.right, seen)];
      if (node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
        const left = staticClasses(node.left, seen),
          right = staticClasses(node.right, seen);
        if (left.length * right.length > 100) throw new Error('동적 클래스 조합이 너무 많습니다.');
        return left.flatMap((l) => right.map((r) => l + r));
      }
    }
    if (ts.isTemplateExpression(node)) {
      let values = [node.head.text];
      for (const part of node.templateSpans) {
        const fragments = staticClasses(part.expression, seen);
        if (values.length * fragments.length > 100)
          throw new Error('동적 template 조합이 너무 많습니다.');
        values = values.flatMap((value) =>
          fragments.map((fragment) => value + fragment + part.literal.text),
        );
      }
      return values;
    }
    if (ts.isObjectLiteralExpression(node)) {
      return node.properties.flatMap((p) => {
        if (ts.isSpreadAssignment(p)) return staticClasses(p.expression, seen);
        if (ts.isPropertyAssignment(p)) {
          if (ts.isComputedPropertyName(p.name)) return staticClasses(p.name.expression, seen);
          return [p.name.text];
        }
        if (ts.isShorthandPropertyAssignment(p)) return [p.name.text];
        throw new Error('클래스 객체의 메서드를 해석할 수 없습니다.');
      });
    }
    if (ts.isCallExpression(node) && isStyleFactory(node)) {
      if (helperKind(node.expression) === 'cva') return cvaClasses(node, seen);
      return node.arguments.flatMap((a) => staticClasses(a, seen));
    }
    if (ts.isCallExpression(node)) {
      const cva = cvaDeclaration(node.expression);
      if (cva) return cvaClasses(cva, seen);
    }
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const object = unwrap(node.expression);
      const moduleImport = rawImport(object);
      if (moduleImport?.moduleSpecifier.text.endsWith('.module.css')) {
        const specifier = moduleImport.moduleSpecifier.text;
        const moduleFile = normalized(
          specifier.startsWith('@/')
            ? path.resolve(root, 'src', specifier.slice(2))
            : path.resolve(path.dirname(node.getSourceFile().fileName), specifier),
        );
        const names = ts.isPropertyAccessExpression(node)
          ? [node.name.text]
          : staticClasses(node.argumentExpression, seen);
        const tree = cssTrees.get(moduleFile);
        if (!tree) throw new Error(`CSS Module을 찾을 수 없습니다: ${moduleFile}`);
        return names.map((name) => {
          if (!tree.nodes.some((rule) => rule.type === 'rule' && rule.selector === `.${name}`))
            throw new Error(`CSS Module 클래스 없음: ${name}`);
          const marker = `__DS_CSS__${encodeURIComponent(moduleFile)}#${name}`;
          moduleClassMarkers.add(marker);
          return marker;
        });
      }
      const initializer = constantInitializer(object);
      if (initializer && ts.isObjectLiteralExpression(initializer)) {
        const names = ts.isPropertyAccessExpression(node)
          ? [node.name.text]
          : staticClasses(node.argumentExpression, seen);
        return names.flatMap((name) => {
          const property = initializer.properties.find(
            (p) =>
              ts.isPropertyAssignment(p) && p.name.getText().replace(/^['"]|['"]$/g, '') === name,
          );
          if (!property) throw new Error(`클래스 속성 없음: ${name}`);
          return staticClasses(property.initializer, new Set([...seen, initializer]));
        });
      }
    }
    if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) {
      const declaration = declarationOf(node),
        initializer = constantInitializer(node);
      if (declaration && !seen.has(declaration) && initializer)
        return staticClasses(initializer, new Set([...seen, declaration]));
      const type = checker.getTypeAtLocation(node);
      const types = type.isUnion() ? type.types : [type];
      if (types.length > 0 && types.every((t) => t.flags & ts.TypeFlags.StringLiteral))
        return types.map((t) => t.value);
    }
    throw new Error(`정적으로 확정할 수 없는 className: ${node.getText().slice(0, 80)}`);
  }
  function cvaClasses(call, seen) {
    const result = call.arguments[0] ? staticClasses(call.arguments[0], seen) : [];
    const config = unwrap(call.arguments[1]);
    if (!config) return result;
    if (!ts.isObjectLiteralExpression(config)) throw new Error('CVA 설정은 정적 객체여야 합니다.');
    for (const property of config.properties) {
      if (!ts.isPropertyAssignment(property)) throw new Error('CVA 설정 spread 금지');
      if (property.name.getText() === 'variants') {
        const variants = unwrap(property.initializer);
        if (!ts.isObjectLiteralExpression(variants))
          throw new Error('CVA variants는 정적 객체여야 합니다.');
        for (const variant of variants.properties) {
          if (!ts.isPropertyAssignment(variant)) throw new Error('CVA variant spread 금지');
          const values = unwrap(variant.initializer);
          if (ts.isObjectLiteralExpression(values)) {
            for (const value of values.properties) {
              if (!ts.isPropertyAssignment(value)) throw new Error('CVA variant 값 spread 금지');
              result.push(...staticClasses(value.initializer, seen));
            }
          } else {
            const object = constantInitializer(values);
            if (!object || !ts.isObjectLiteralExpression(object))
              throw new Error('CVA variants 참조를 해석할 수 없습니다.');
            for (const value of object.properties) {
              if (!ts.isPropertyAssignment(value)) throw new Error('CVA variant 값 spread 금지');
              result.push(...staticClasses(value.initializer, seen));
            }
          }
        }
      } else if (property.name.getText() === 'compoundVariants') {
        const compounds = unwrap(property.initializer);
        if (!ts.isArrayLiteralExpression(compounds))
          throw new Error('compoundVariants는 정적 배열이어야 합니다.');
        for (const entry of compounds.elements) {
          if (!ts.isObjectLiteralExpression(entry))
            throw new Error('compoundVariants 값은 정적 객체여야 합니다.');
          for (const p of entry.properties)
            if (ts.isPropertyAssignment(p) && ['class', 'className'].includes(p.name.getText()))
              result.push(...staticClasses(p.initializer, seen));
        }
      } else if (property.name.getText() !== 'defaultVariants') throw new Error('미등록 CVA 설정');
    }
    return result;
  }
  function checkClasses(values, at, allowedAppearance, textOnly = false, layoutOnly = false) {
    for (const literal of values)
      for (const item of literal.split(/\s+/).filter(Boolean)) {
        if (moduleClassMarkers.has(item)) {
          if (layoutOnly) {
            const [encoded, name] = item.slice('__DS_CSS__'.length).split('#');
            const rules = [];
            cssTrees.get(decodeURIComponent(encoded))?.walkRules((rule) => {
              if ([`.${name}`, `.${name}[open]`, `.${name}::backdrop`].includes(rule.selector))
                rules.push(rule);
            });
            for (const rule of rules) {
              rule.walkDecls((declaration) => {
                if (!exteriorProperty.test(declaration.prop))
                  at(
                    'DS_SCREEN_STYLE',
                    `배치 className의 내부 구조/외형 CSS 금지: ${declaration.prop}`,
                  );
              });
              rule.walkAtRules((entry) => {
                if (entry.name === 'apply') checkClasses([entry.params], at, false, false, true);
              });
            }
          }
          continue;
        }
        const parts = item.split(':');
        const base = parts.pop();
        if (/[\[\]{}]/.test(item) || item.startsWith('!') || item.endsWith('!')) {
          at('DS_TOKEN_LITERAL', `임의 값·속성·important 클래스 금지: ${item}`);
          continue;
        }
        if (parts.some((v) => !variants.has(v))) {
          at('DS_BREAKPOINT', `미등록 variant 또는 breakpoint: ${item}`);
          continue;
        }
        const utility = design.policy.utilities[base];
        if (
          layoutOnly &&
          !(
            (structures.has(base) || utility?.role === 'layout') &&
            (exteriorStructures.has(base) || exteriorUtility.test(base))
          )
        )
          at('DS_SCREEN_STYLE', `배치 className의 내부 구조/외형 덮어쓰기 금지: ${item}`);
        if (!utility && !structures.has(base)) {
          at('DS_TOKEN_UNKNOWN', `미등록 Tailwind utility: ${item}`);
          continue;
        }
        if (
          !allowedAppearance &&
          !layoutOnly &&
          utility &&
          utility.role !== 'layout' &&
          !(textOnly && utility.role === 'text')
        )
          at('DS_SCREEN_STYLE', `조합 화면의 새 외형 금지: ${item}`);
      }
  }
  function attributeValues(attribute) {
    if (!attribute.initializer) return [true];
    if (ts.isStringLiteral(attribute.initializer)) return [attribute.initializer.text];
    const expression = unwrap(attribute.initializer.expression);
    if (
      expression?.kind === ts.SyntaxKind.TrueKeyword ||
      expression?.kind === ts.SyntaxKind.FalseKeyword
    )
      return [expression.kind === ts.SyntaxKind.TrueKeyword];
    if (expression && ts.isNumericLiteral(expression)) return [Number(expression.text)];
    try {
      return staticClasses(expression);
    } catch {
      return null;
    }
  }
  for (const source of program.getSourceFiles()) {
    if (!sourceSet.has(source.fileName)) continue;
    const file = normalized(source.fileName);
    const atNode = (node, code, message) =>
      report(
        code,
        file,
        source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
        message,
      );
    const allowedAppearance = approvedFiles.has(file);
    const allowNative = componentFiles.has(file);
    function classExpression(node, textOnly = false, layoutOnly = false) {
      try {
        checkClasses(
          staticClasses(node),
          (code, message) => atNode(node, code, message),
          layoutOnly ? false : allowedAppearance,
          layoutOnly ? false : textOnly,
          layoutOnly,
        );
      } catch (error) {
        atNode(node, 'DS_CLASS_DYNAMIC', error.message);
      }
    }
    function inspect(node) {
      if (
        (ts.isFunctionDeclaration(node) ||
          (ts.isVariableDeclaration(node) &&
            node.initializer &&
            (ts.isArrowFunction(unwrap(node.initializer)) ||
              ts.isFunctionExpression(unwrap(node.initializer)) ||
              ts.isCallExpression(unwrap(node.initializer))))) &&
        containsJsx(node)
      ) {
        const name = node.name?.getText();
        if (name && !approved.has(`${file}#${name}`) && !isComposition(file, node))
          atNode(node, 'DS_COMPONENT_UNKNOWN', `미등록 UI 함수: ${name}`);
      }
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const name = node.moduleSpecifier.text;
        if (
          /^(?:next\/font|styled-components|@emotion|styled-jsx|react\/jsx-runtime|react\/jsx-dev-runtime)/.test(
            name,
          ) &&
          !(name === 'next/font/local' && file === design.policy.font.module)
        )
          atNode(node, 'DS_IMPORT', `미등록 스타일/폰트 모듈: ${name}`);
        if (
          /\.(?:css|s[ac]ss|less)$/.test(name) &&
          !/\.module\.css$/.test(name) &&
          !(file === 'app/layout.tsx' && name === '@/_app/styles/globals.css' && !node.importClause)
        )
          atNode(node, 'DS_STYLE_IMPORT', `미등록 전역 스타일 import: ${name}`);
        if (name.includes('code temp'))
          atNode(node, 'DS_IMPORT', '참고 예제를 제품 UI로 import할 수 없습니다.');
      }
      if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
      )
        atNode(
          node,
          'DS_DYNAMIC_IMPORT',
          '검증할 수 없는 동적 import/require는 허용하지 않습니다.',
        );
      if (ts.isCallExpression(node) && isStyleFactory(node)) {
        try {
          checkClasses(
            staticClasses(node),
            (code, message) => atNode(node, code, message),
            allowedAppearance,
          );
        } catch (error) {
          atNode(node, 'DS_CLASS_DYNAMIC', error.message);
        }
      }
      if (ts.isTaggedTemplateExpression(node))
        atNode(node, 'DS_STYLE_INJECTION', '태그 template 스타일/UI 주입 금지');
      if (
        ts.isElementAccessExpression(node) &&
        dynamicFactoryTarget(node.expression) &&
        (!ts.isStringLiteralLike(node.argumentExpression) ||
          factoryNames.has(node.argumentExpression.text))
      )
        atNode(node, 'DS_FACTORY', '동적 React/DOM factory 접근 금지');
      if (
        ts.isComputedPropertyName(node) &&
        ts.isBindingElement(node.parent) &&
        ts.isObjectBindingPattern(node.parent.parent) &&
        ts.isVariableDeclaration(node.parent.parent.parent) &&
        dynamicFactoryTarget(node.parent.parent.parent.initializer)
      )
        atNode(node, 'DS_FACTORY', '동적 React/DOM factory 구조분해 금지');
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.getText() === 'Reflect.get' &&
        dynamicFactoryTarget(node.arguments[0])
      )
        atNode(node, 'DS_FACTORY', '동적 React/DOM factory 반사 접근 금지');
      if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        /(?:\.style(?:\.|\[|$)|\.(?:className|innerHTML|outerHTML)$)/.test(node.left.getText()) &&
        !(
          file === 'src/shared/ui/bottom-sheet/bottom-sheet.tsx' &&
          node.left.getText() === 'dialog.style.height' &&
          node.right.getText() === '`${next}px`' &&
          ts.isTemplateExpression(node.right) &&
          declarationOf(node.left.expression.expression)?.initializer?.getText() ===
            'ref.current' &&
          declarationOf(node.right.templateSpans[0].expression)?.initializer?.getText() ===
            'Math.min(max, Math.max(min, Math.round(height)))'
        )
      )
        atNode(node, 'DS_STYLE_INJECTION', 'DOM 스타일/HTML 직접 변경 금지');
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        (/\.classList$/.test(node.expression.expression.getText()) ||
          ['insertAdjacentHTML', 'write'].includes(node.expression.name.text) ||
          (node.expression.name.text === 'setAttribute' &&
            ts.isStringLiteralLike(node.arguments[0]) &&
            ['style', 'class'].includes(node.arguments[0].text)))
      )
        atNode(node, 'DS_STYLE_INJECTION', 'DOM class/스타일/HTML 직접 주입 금지');
      if (
        ts.isIdentifier(node) ||
        ts.isPropertyAccessExpression(node) ||
        ts.isElementAccessExpression(node)
      ) {
        const name = ts.isPropertyAccessExpression(node)
          ? node.name.text
          : ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression)
            ? node.argumentExpression.text
            : importedName(node);
        if (factoryNames.has(name)) {
          const identity = sourceIdentity(node);
          if (
            !identity ||
            identity.file.includes('node_modules') ||
            ts.isPropertyAccessExpression(node) ||
            ts.isElementAccessExpression(node)
          )
            atNode(node, 'DS_FACTORY', 'JSX 우회 UI factory 사용 금지');
        }
      }
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText();
        const native = ts.isIdentifier(node.tagName) && /^[a-z]/.test(tag);
        let contract;
        if (native) {
          if ((!structuralTags.has(tag) || tag === 'style') && !allowNative)
            atNode(node, 'DS_NATIVE_UI', `등록 컴포넌트 밖의 <${tag}> 사용 금지`);
          if (['svg', 'path', 'style', 'script'].includes(tag))
            atNode(
              node,
              'DS_STYLE_INJECTION',
              '원본 에셋을 사용해야 합니다. inline SVG/style/script 금지',
            );
          if (['iframe', 'object', 'embed'].includes(tag))
            atNode(node, 'DS_ASSET', '외부 HTML/임베드 UI는 허용하지 않습니다.');
        } else {
          const identity = sourceIdentity(node.tagName);
          contract = identity && approved.get(`${identity.file}#${identity.name}`);
          const builtIn =
            identity?.file.includes('node_modules') &&
            ['Fragment', 'Suspense'].includes(identity.name) &&
            /(?:^|\/)react\//.test(identity.file);
          const composition =
            identity &&
            !identity.file.includes('node_modules') &&
            isComposition(identity.file, identity.declaration);
          const provider =
            identity &&
            (design.policy.providers ?? []).some(
              (entry) =>
                identity.file.startsWith(`node_modules/${entry.module}/`) &&
                entry.exports.includes(identity.name),
            );
          if (
            composition &&
            legacyByFile.has(identity.file) &&
            !(
              file === 'app/layout.tsx' &&
              identity.file === 'src/_app/providers/index.tsx' &&
              identity.name === 'Providers'
            )
          )
            atNode(
              node,
              'DS_LEGACY_USE',
              `미이관 조합 UI의 신규 사용 금지: ${identity.file}#${identity.name}`,
            );
          if (!contract && !builtIn && !composition && !provider)
            atNode(
              node,
              'DS_COMPONENT_UNKNOWN',
              `미승인 UI 사용: ${identity ? `${identity.file}#${identity.name}` : tag}`,
            );
        }
        if (contract?.propCombinations) {
          const keys = new Set(
            contract.propCombinations.flatMap((combination) => Object.keys(combination)),
          );
          let combinations = [{}];
          for (const key of keys) {
            const attribute = node.attributes.properties.find(
              (item) => ts.isJsxAttribute(item) && item.name.getText() === key,
            );
            const values = attribute
              ? attributeValues(attribute)
              : Object.hasOwn(contract.defaultProps ?? {}, key)
                ? [contract.defaultProps[key]]
                : null;
            if (!attribute && !values) continue;
            if (!values?.length || combinations.length * values.length > 100) {
              combinations = [];
              break;
            }
            combinations = combinations.flatMap((entry) =>
              values.map((value) => ({ ...entry, [key]: value })),
            );
          }
          if (
            !combinations.length ||
            combinations.some(
              (values) =>
                !contract.propCombinations.some((combination) =>
                  Object.entries(values).every(([key, value]) => combination[key]?.includes(value)),
                ),
            )
          )
            atNode(node, 'DS_PROP', `미등록 ${contract.name} props 조합`);
        }
        for (const attribute of node.attributes.properties) {
          if (ts.isJsxSpreadAttribute(attribute)) {
            if (!native || !safeNativeSpread(attribute, tag))
              atNode(attribute, 'DS_PROP_SPREAD', '검증되지 않은 JSX spread 금지');
            continue;
          }
          const name = attribute.name.getText();
          if (name === 'srcDoc') atNode(attribute, 'DS_ASSET', 'srcDoc HTML 주입 금지');
          if (['src', 'srcSet', 'poster'].includes(name)) {
            let values;
            const expression =
              attribute.initializer &&
              (ts.isJsxExpression(attribute.initializer)
                ? attribute.initializer.expression
                : attribute.initializer);
            try {
              values = staticClasses(expression);
            } catch {
              values = [];
            }
            const approvedValues =
              values?.length > 0 &&
              values.every((value) =>
                name === 'srcSet'
                  ? value.split(',').every((entry) => {
                      const match = /^(\S+)(?:\s+\d+(?:\.\d+)?[wx])?$/.exec(entry.trim());
                      return match && uiAssets.has(match[1]);
                    })
                  : uiAssets.has(value),
              );
            if (!approvedValues)
              atNode(attribute, 'DS_ASSET', '원본으로 승인한 정적 에셋 URL만 사용할 수 있습니다.');
          }
          if (
            ['style', 'dangerouslySetInnerHTML', 'css', 'sx'].includes(name) ||
            (tag === 'style' && ['jsx', 'global'].includes(name))
          )
            atNode(attribute, 'DS_STYLE_INJECTION', `스타일/HTML 직접 주입 금지: ${name}`);
          if (
            native &&
            structuralTags.has(tag) &&
            !allowNative &&
            (name.startsWith('on') ||
              ['button', 'textbox', 'switch', 'checkbox', 'radio', 'link'].includes(
                attribute.initializer?.text,
              ))
          )
            atNode(attribute, 'DS_NATIVE_UI', '구조 요소에 상호작용 UI를 만들 수 없습니다.');
          if (name === 'className' && attribute.initializer) {
            if (contract && !contract.layoutProps?.includes('className'))
              atNode(attribute, 'DS_PROP', '등록 UI의 외형 className 덮어쓰기 금지');
            const expression = ts.isJsxExpression(attribute.initializer)
              ? attribute.initializer.expression
              : attribute.initializer;
            const fontIdentity =
              expression && ts.isPropertyAccessExpression(expression)
                ? sourceIdentity(expression.expression)
                : null;
            if (!(
              file === 'app/layout.tsx' &&
              tag === 'html' &&
              expression?.name?.text === 'variable' &&
              fontIdentity?.file === design.policy.font.module &&
              fontIdentity.name === 'pretendard'
            ))
              classExpression(
                expression,
                native && textTags.has(tag),
                Boolean(contract?.layoutProps?.includes('className')),
              );
          }
          if (
            contract &&
            !['children', 'key', 'ref'].includes(name) &&
            !name.startsWith('aria-') &&
            !name.startsWith('data-')
          ) {
            if (contract.props[name]) {
              const values = attributeValues(attribute);
              if (
                !values ||
                values.length === 0 ||
                values.some((v) => !contract.props[name].includes(v))
              )
                atNode(attribute, 'DS_PROP', `미등록 ${contract.name}.${name} 값`);
            } else if (
              !contract.allowedProps.includes(name) &&
              !safeNativeAttribute(contract, name, node)
            )
              atNode(attribute, 'DS_PROP', `미등록 ${contract.name}.${name} 속성`);
          }
        }
      }
      ts.forEachChild(node, inspect);
    }
    inspect(source);
  }
  for (const component of design.components.approved) {
    const source = program.getSourceFile(path.join(root, component.file));
    const symbol = source && checker.getSymbolAtLocation(source);
    if (
      !symbol ||
      !checker.getExportsOfModule(symbol).some((value) => value.name === component.name)
    )
      report('DS_COMPONENT_EXPORT', component.file, 1, `등록 export 누락: ${component.name}`);
    for (const file of component.styles ?? [])
      if (!allFiles.includes(path.join(root, file)))
        report('DS_COMPONENT_STYLE', file, 1, '등록 style 모듈 누락');
  }
  const cssVariableEntries = new Map();
  for (const utility of Object.values(design.policy.utilities))
    for (const entry of utility.theme)
      cssVariableEntries.set(entry.variable, {
        ...entry,
        tokens: utility.tokens,
        sourceGeometry: utility.sourceGeometry,
      });
  for (const [file, tree] of cssTrees) {
    const allowed = design.policy.cssEntries.includes(file);
    const componentStyle = design.components.approved.some((c) => (c.styles ?? []).includes(file));
    const at = (node, code, message) => report(code, file, node.source?.start.line, message);
    if (!allowed && !file.endsWith('.module.css') && !componentStyle)
      report('DS_CSS_ENTRY', file, 1, '미등록 전역 stylesheet 금지');
    tree.walkRules((rule) => {
      const localSelector = componentStyle
        ? /^\.[a-zA-Z_][\w-]*(?:::backdrop|\[open\])?$/
        : /^\.[a-zA-Z_][\w-]*$/;
      if (!localSelector.test(rule.selector))
        at(
          rule,
          'DS_SELECTOR',
          `단일 local 클래스만 허용합니다. 내부/전역 덮어쓰기 금지: ${rule.selector}`,
        );
    });
    tree.walkAtRules((rule) => {
      if (rule.name === 'media') {
        const accepted =
          (componentStyle && rule.params === '(prefers-reduced-motion: reduce)') ||
          Object.values(design.policy.breakpoints).some(
            (value) =>
              rule.params === `(min-width: ${value})` || rule.params === `(width >= ${value})`,
          );
        if (!accepted) at(rule, 'DS_BREAKPOINT', `미등록 CSS media: ${rule.params}`);
      } else if (rule.name === 'apply') {
        checkClasses([rule.params], (code, message) => at(rule, code, message), componentStyle);
      } else if (!allowed || !['import', 'theme', 'utility'].includes(rule.name))
        at(rule, 'DS_CSS_ATRULE', `미등록 CSS 규칙: @${rule.name}`);
      if (
        rule.name === 'import' &&
        !design.policy.cssImports.includes(rule.params.replace(/^['"]|['"]$/g, ''))
      )
        at(rule, 'DS_STYLE_IMPORT', `미등록 CSS import: ${rule.params}`);
    });
    tree.walkDecls((declaration) => {
      if (declaration.prop.startsWith('--')) {
        const entry = cssVariableEntries.get(declaration.prop);
        if (!entry || entry.file !== file || entry.value !== declaration.value)
          at(declaration, 'DS_TOKEN_UNKNOWN', `미등록 변수 선언: ${declaration.prop}`);
        return;
      }
      if (!componentStyle && !layoutProperty.test(declaration.prop))
        at(declaration, 'DS_SCREEN_STYLE', `미등록 UI 외형 CSS: ${declaration.prop}`);
      const nodes = valueParser(declaration.value);
      nodes.walk((value) => {
        if (value.type === 'function' && value.value === 'var') {
          const significant = value.nodes.filter((v) => v.type !== 'space' && v.type !== 'comment');
          const entry =
            significant.length === 1 && significant[0].type === 'word'
              ? cssVariableEntries.get(significant[0].value)
              : null;
          if (!entry)
            at(
              declaration,
              'DS_TOKEN_UNKNOWN',
              `미등록 CSS 변수/fallback: ${valueParser.stringify(value)}`,
            );
          else {
            const variable = entry.variable;
            const motionKinds = {
              'transition-duration': ['--duration-', 'duration'],
              'grid-template-rows': ['--grid-', 'grid-track'],
              rotate: ['--rotate-', 'angle'],
              'transition-timing-function': ['--ease-', 'easing'],
            };
            const motion = motionKinds[entry.sourceGeometry?.property];
            const kind =
              motion && variable.startsWith(motion[0])
                ? motion[1]
                : variable.startsWith('--color-')
                  ? 'color'
                  : variable === '--spacing' ||
                      (entry.sourceGeometry &&
                        (variable.startsWith('--spacing-') || variable === '--container-toast'))
                    ? 'spacing'
                    : entry.sourceGeometry?.property === 'opacity' &&
                        variable.startsWith('--opacity-')
                      ? 'opacity'
                      : variable.startsWith('--radius-')
                        ? 'radius'
                        : variable.endsWith('--font-weight')
                          ? 'weight'
                          : variable.endsWith('--line-height')
                            ? 'leading'
                            : variable.endsWith('--letter-spacing')
                              ? 'tracking'
                              : variable.startsWith('--text-')
                                ? 'size'
                                : 'unknown';
            const property = declaration.prop;
            const expected = motionKinds[property]
              ? [motionKinds[property][1]]
              : /(?:^color$|color$|^fill$|^stroke$|^background)/.test(property)
                ? ['color']
                : property === 'opacity'
                  ? ['opacity']
                  : /^border-radius/.test(property)
                    ? ['radius']
                    : property === 'font-size'
                      ? ['size']
                      : property === 'font-weight'
                        ? ['weight']
                        : property === 'line-height'
                          ? ['leading']
                          : property === 'letter-spacing'
                            ? ['tracking']
                            : /^(?:padding|margin|gap|row-gap|column-gap|width|height|min-width|max-width|min-height|max-height|inset|top|right|bottom|left)/.test(
                                  property,
                                )
                              ? ['spacing']
                              : null;
            if (expected && !expected.includes(kind))
              at(
                declaration,
                'DS_TOKEN_TYPE',
                `${property}에 ${kind} 토큰을 사용할 수 없습니다: ${variable}`,
              );
          }
          return false;
        }
        if (value.type === 'function') {
          at(declaration, 'DS_TOKEN_LITERAL', `미등록 CSS 함수: ${value.value}`);
          return false;
        }
        const transitionProperty =
          componentStyle &&
          declaration.prop === 'transition-property' &&
          ['grid-template-rows', 'rotate'].includes(value.value);
        if (value.type === 'word' && !structuralValues.has(value.value) && !transitionProperty)
          at(declaration, 'DS_TOKEN_LITERAL', `직접 CSS 값 금지: ${value.value}`);
      });
    });
  }
  const unique = [...new Map(diagnostics.map((d) => [JSON.stringify(d), d])).values()];
  if (includeLegacy) return unique;
  return unique.filter((diagnostic) => {
    const entry = legacyByFile.get(diagnostic.file);
    return (
      !entry ||
      sourceHashes.get(entry.file) !== entry.sha256 ||
      !entry.diagnostics.some(
        (old) =>
          old.code === diagnostic.code &&
          old.line === diagnostic.line &&
          old.message === diagnostic.message,
      )
    );
  });
}

export function printDiagnostics(diagnostics) {
  for (const d of diagnostics) console.error(`${d.code} · ${d.file}:${d.line} · ${d.message}`);
  if (diagnostics.length === 0) console.log('디자인 규칙 검증 통과');
}

async function runCli() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--watch', '--include-legacy'].includes(arg)))
    throw new Error('지원하지 않는 옵션');
  const inspect = async () => {
    const diagnostics = await checkDesign(root, {
      includeLegacy: args.includes('--include-legacy'),
    });
    printDiagnostics(diagnostics);
    if (diagnostics.length === 0) {
      const legacy = JSON.parse(await readFile(path.join(root, 'design/legacy.json'), 'utf8'));
      const components = JSON.parse(
        await readFile(path.join(root, 'design/components.json'), 'utf8'),
      );
      console.log(
        `DS_MIGRATION_PENDING · 기존 ${legacy.entries.length}개 파일/${legacy.entries.reduce((count, entry) => count + entry.diagnostics.length, 0)}개 진단 보존 · 승인 UI ${components.approved.length}개/미확인 UI ${components.pending.length}개. 현재 앱 전체가 Figma 명세를 충족한다는 뜻이 아닙니다.`,
      );
    }
    return diagnostics;
  };
  if (!args.includes('--watch')) {
    process.exitCode = (await inspect()).length > 0 ? 1 : 0;
    return;
  }
  const watchers = [];
  let timer,
    running = false,
    queued = false,
    stopped = false;
  const stop = (code) => {
    stopped = true;
    clearTimeout(timer);
    watchers.forEach((w) => w.close());
    process.exitCode = code;
  };
  async function changed() {
    if (stopped) return;
    if (running) {
      queued = true;
      return;
    }
    running = true;
    try {
      await inspect();
    } catch (error) {
      console.error(error.message);
      stop(1);
    } finally {
      running = false;
      if (queued) {
        queued = false;
        void changed();
      }
    }
  }
  try {
    for (const directory of ['app', 'src', 'design', 'public']) {
      try {
        const watcher = watch(path.join(root, directory), { recursive: true }, () => {
          clearTimeout(timer);
          timer = setTimeout(() => void changed(), 150);
        });
        watcher.on('error', (error) => {
          console.error(error.message);
          stop(1);
        });
        watchers.push(watcher);
      } catch (error) {
        if (!(directory === 'public' && error.code === 'ENOENT')) throw error;
      }
    }
    if ((await inspect()).length > 0) {
      stop(1);
      return;
    }
    console.log('DS_WATCH_READY');
    process.send?.({ type: 'design-watch-ready' });
    process.once('SIGINT', () => stop(130));
    process.once('SIGTERM', () => stop(143));
  } catch (error) {
    stop(1);
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  runCli().catch((error) => {
    console.error(`DS_CHECKER_ERROR: ${error.message}`);
    process.exitCode = 1;
  });
