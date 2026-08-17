import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const IMPORT_RE = /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]\s*;/g;
const SIDE_EFFECT_IMPORT_RE = /import\s+['"]([^'"]+)['"]\s*;/g;

function normalizeId(file, sourceRoot) {
  return path.relative(sourceRoot, file).split(path.sep).join('/');
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) {
    throw new Error(`Only relative imports are supported by the zero-dependency bundler: ${specifier}`);
  }
  const resolved = path.resolve(path.dirname(fromFile), specifier);
  return path.extname(resolved) ? resolved : `${resolved}.js`;
}

function importClauseToCode(clause, dependencyId) {
  const value = clause.trim();
  if (value.startsWith('{') && value.endsWith('}')) {
    const fields = value.slice(1, -1)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const parts = item.split(/\s+as\s+/i).map((part) => part.trim());
        return parts.length === 2 ? `${parts[0]}: ${parts[1]}` : parts[0];
      });
    return `const { ${fields.join(', ')} } = __require(${JSON.stringify(dependencyId)});`;
  }
  if (/^\*\s+as\s+/.test(value)) {
    const local = value.replace(/^\*\s+as\s+/, '').trim();
    return `const ${local} = __require(${JSON.stringify(dependencyId)});`;
  }
  if (/^[A-Za-z_$][\w$]*$/.test(value)) {
    return `const { default: ${value} } = __require(${JSON.stringify(dependencyId)});`;
  }
  throw new Error(`Unsupported import clause: ${value}`);
}

function transformExports(source) {
  const exports = [];
  let code = source;

  code = code.replace(/export\s+(async\s+)?function\s+([A-Za-z_$][\w$]*)/g, (_match, asyncPart = '', name) => {
    exports.push({ exported: name, local: name });
    return `${asyncPart || ''}function ${name}`;
  });
  code = code.replace(/export\s+class\s+([A-Za-z_$][\w$]*)/g, (_match, name) => {
    exports.push({ exported: name, local: name });
    return `class ${name}`;
  });
  code = code.replace(/export\s+(const|let|var)\s+([A-Za-z_$][\w$]*)/g, (_match, kind, name) => {
    exports.push({ exported: name, local: name });
    return `${kind} ${name}`;
  });
  code = code.replace(/export\s*\{([\s\S]*?)\}\s*;/g, (_match, body) => {
    for (const item of body.split(',').map((value) => value.trim()).filter(Boolean)) {
      const parts = item.split(/\s+as\s+/i).map((value) => value.trim());
      exports.push(parts.length === 2
        ? { local: parts[0], exported: parts[1] }
        : { local: parts[0], exported: parts[0] });
    }
    return '';
  });

  const unique = new Map();
  for (const item of exports) unique.set(item.exported, item);
  const assignment = [...unique.values()]
    .map(({ exported, local }) => exported === local ? local : `${JSON.stringify(exported)}: ${local}`)
    .join(', ');
  if (assignment) code += `\nObject.assign(__exports, { ${assignment} });\n`;
  return code;
}

export async function bundleEntry({ entry, outfile, sourceRoot }) {
  const modules = new Map();

  async function load(file) {
    const absolute = path.resolve(file);
    const id = normalizeId(absolute, sourceRoot);
    if (modules.has(id)) return id;
    let source = await readFile(absolute, 'utf8');
    const dependencies = [];

    source = source.replace(IMPORT_RE, (_match, clause, specifier) => {
      const dependencyFile = resolveImport(absolute, specifier);
      const dependencyId = normalizeId(dependencyFile, sourceRoot);
      dependencies.push(dependencyFile);
      return importClauseToCode(clause, dependencyId);
    });
    source = source.replace(SIDE_EFFECT_IMPORT_RE, (_match, specifier) => {
      const dependencyFile = resolveImport(absolute, specifier);
      const dependencyId = normalizeId(dependencyFile, sourceRoot);
      dependencies.push(dependencyFile);
      return `__require(${JSON.stringify(dependencyId)});`;
    });
    source = transformExports(source);
    modules.set(id, source);
    for (const dependency of dependencies) await load(dependency);
    return id;
  }

  const entryId = await load(entry);
  const pieces = [
    '(() => {',
    "'use strict';",
    'const __modules = Object.create(null);',
    'const __cache = Object.create(null);'
  ];
  for (const [id, code] of modules) {
    pieces.push(`__modules[${JSON.stringify(id)}] = function(__exports, __require) {\n${code}\n};`);
  }
  pieces.push(`function __require(id) {
  if (__cache[id]) return __cache[id];
  const factory = __modules[id];
  if (!factory) throw new Error('Module not found: ' + id);
  const exports = Object.create(null);
  __cache[id] = exports;
  factory(exports, __require);
  return exports;
}`);
  pieces.push(`__require(${JSON.stringify(entryId)});`);
  pieces.push('})();', '');
  await writeFile(outfile, pieces.join('\n'));
}
