// Simple build script for bundling MV3 extension assets with esbuild.
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');
const outdir = path.join(process.cwd(), 'dist');

const entryPoints = {
  background: path.join('src', 'background', 'index.ts'),
  'content-script': path.join('src', 'content', 'index.ts'),
  popup: path.join('src', 'popup', 'index.ts'),
  options: path.join('src', 'options', 'index.ts')
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyStatic() {
  ensureDir(outdir);
  const files = [
    { from: 'manifest.json', to: 'manifest.json' },
    { from: path.join('src', 'popup', 'index.html'), to: 'popup.html' },
    { from: path.join('src', 'options', 'index.html'), to: 'options.html' },
    { from: path.join('src', 'content', 'content-script.css'), to: 'content-script.css' }
  ];

  for (const file of files) {
    const src = path.join(process.cwd(), file.from);
    const dest = path.join(outdir, file.to);
    fs.copyFileSync(src, dest);
  }
}

const copyStaticPlugin = {
  name: 'copy-static',
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length) return;
      copyStatic();
      if (!isWatch) {
        console.log('Static assets copied.');
      }
    });
  }
};

const buildOptions = {
  entryPoints,
  bundle: true,
  outdir,
  format: 'esm',
  target: 'es2020',
  platform: 'browser',
  entryNames: '[name]',
  sourcemap: true,
  logLevel: 'info',
  plugins: [copyStaticPlugin]
};

async function run() {
  ensureDir(outdir);

  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(buildOptions);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
