import path from 'node:path';

const layers = ['_app', 'widgets', 'features', 'entities', 'shared'];
function describe(filename) {
  const relative = path.relative(path.resolve('src'), filename).replaceAll(path.sep, '/');
  const [layer, slice] = relative.split('/');
  return layers.includes(layer) ? { layer, slice, relative } : null;
}

const plugin = {
  rules: {
    'import-boundaries': {
      meta: { type: 'problem', schema: [], messages: { boundary: 'FSD: {{reason}}' } },
      create(context) {
        const filename = context.filename ?? context.getFilename();
        const from = describe(filename);
        function inspect(node, value) {
          if (typeof value !== 'string' || (!value.startsWith('@/') && !value.startsWith('.')))
            return;
          const target = value.startsWith('@/')
            ? path.resolve('src', value.slice(2))
            : path.resolve(path.dirname(filename), value);
          const to = describe(target);
          if (!to) return;
          let reason;
          if (from && layers.indexOf(from.layer) > layers.indexOf(to.layer))
            reason = '하위 레이어에서 상위 레이어 참조 금지';
          else if (
            from &&
            from.layer === to.layer &&
            from.slice !== to.slice &&
            !['_app', 'shared'].includes(from.layer)
          )
            reason = '같은 레이어의 다른 slice 참조 금지';
          else if (!(from && from.layer === to.layer && from.slice === to.slice)) {
            const parts = to.relative.split('/');
            const isUtility = to.layer === 'shared' && to.slice === 'lib';
            const publicDepth = isUtility ? 3 : 2;
            const isIndex = /^index(?:\.(?:server|client))?(?:\.[mc]?[jt]sx?)?$/.test(parts.at(-1));
            const isStyle =
              to.layer === '_app' && to.slice === 'styles' && parts.at(-1).endsWith('.css');
            const isPublic =
              isStyle ||
              parts.length === publicDepth ||
              (parts.length === publicDepth + 1 && isIndex);
            if (!isPublic) reason = 'slice/segment public API로 import 필요';
          }
          if (reason) context.report({ node, messageId: 'boundary', data: { reason } });
        }
        return {
          ImportDeclaration(node) {
            inspect(node, node.source.value);
          },
          ExportNamedDeclaration(node) {
            if (node.source) inspect(node, node.source.value);
          },
          ExportAllDeclaration(node) {
            inspect(node, node.source.value);
          },
          ImportExpression(node) {
            inspect(node, node.source.value);
          },
        };
      },
    },
  },
};

export default plugin;
