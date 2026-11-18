import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const clientDir = import.meta.dir;
const distDir = path.join(clientDir, 'dist');
const typesDir = path.join(distDir, 'types');
const serverSrcTypesDir = path.join(typesDir, 'src');

await rm(distDir, { recursive: true, force: true });

const bundle = await Bun.build({
  entrypoints: [path.join(clientDir, 'src/index.ts')],
  outdir: distDir,
  target: 'browser',
  format: 'esm',
  external: ['hono', 'hono/*'],
  sourcemap: 'linked',
});

if (!bundle.success) {
  console.error(bundle.logs);
  process.exit(1);
}

const tsc = Bun.spawnSync(['bun', 'x', 'tsc', '-p', path.join(clientDir, 'tsconfig.json')], {
  stdout: 'inherit',
  stderr: 'inherit',
});

if (tsc.exitCode !== 0) {
  process.exit(tsc.exitCode ?? 1);
}

// tsc keeps the server's `@/…` path aliases in .d.ts files; consumers can't resolve them.
const toRelative = (fromFile: string, aliasPath: string) => {
  const target = path.relative(path.dirname(fromFile), path.join(serverSrcTypesDir, aliasPath));
  return `${target.startsWith('.') ? target : `./${target}`}.js`;
};

const declarationFiles = (await readdir(typesDir, { recursive: true }))
  .filter((file) => file.endsWith('.d.ts'))
  .map((file) => path.join(typesDir, file));

for (const file of declarationFiles) {
  const source = await readFile(file, 'utf8');
  const rewritten = source.replace(
    /(from\s+|import\()(['"])@\/([^'"]+)\2/g,
    (_, prefix: string, quote: string, aliasPath: string) =>
      `${prefix}${quote}${toRelative(file, aliasPath)}${quote}`
  );

  if (/['"]@\//.test(rewritten)) {
    console.error(`Unresolved @/ alias left in ${file}`);
    process.exit(1);
  }

  await writeFile(file, rewritten);
}

console.log(`Built client: ${bundle.outputs.length} JS file(s), ${declarationFiles.length} .d.ts`);
