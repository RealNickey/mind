import { build, context } from 'esbuild';
import { writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isWatch = process.argv.includes('--watch');

const sharedConfig = {
  bundle: true,
  sourcemap: true,
  minify: false,
  platform: 'browser',
  target: 'es2020',
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
};

const buildTargets = [
  {
    entryPoints: [path.join(__dirname, 'background.ts')],
    outfile: path.join(__dirname, 'background.js'),
    format: 'esm',
  },
  {
    entryPoints: [path.join(__dirname, 'content.ts')],
    outfile: path.join(__dirname, 'content.js'),
    format: 'iife',
  },
  {
    entryPoints: [path.join(__dirname, 'popup.tsx')],
    outfile: path.join(__dirname, 'popup.js'),
    format: 'iife',
    jsx: 'automatic',
  },
];

async function ensurePopupHtml() {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MyMind Clipper</title>
  </head>
  <body></body>
  <script src="popup.js"></script>
</html>
`;

  await writeFile(path.join(__dirname, 'popup.html'), html, 'utf8');
}

async function buildAll() {
  await ensurePopupHtml();
  await Promise.all(
    buildTargets.map((target) => build({
      ...sharedConfig,
      ...target,
    }))
  );
}

async function watchAll() {
  await ensurePopupHtml();
  const contexts = await Promise.all(
    buildTargets.map((target) => context({
      ...sharedConfig,
      ...target,
    }))
  );

  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log('Watching chrome-extension for changes...');
}

if (isWatch) {
  await watchAll();
} else {
  await buildAll();
}
