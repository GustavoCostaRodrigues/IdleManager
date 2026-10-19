#!/usr/bin/env node
/**
 * Pipeline de build do Poke Idle Manager (esbuild).
 *
 *   node scripts/build.mjs               → build de desenvolvimento (sourcemaps)
 *   node scripts/build.mjs --production  → build minificado para empacotamento
 *   node scripts/build.mjs --watch       → watch + (re)inicia o Electron a cada rebuild
 */
import { build, context } from 'esbuild';
import { spawn } from 'node:child_process';
import { watch as fsWatch } from 'node:fs';
import { copyFile, cp, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (...segments) => path.join(root, ...segments);

const argv = new Set(process.argv.slice(2));
const isWatch = argv.has('--watch');
const isProd = argv.has('--production');

/** @type {import('esbuild').BuildOptions} */
const shared = {
  absWorkingDir: root,
  bundle: true,
  minify: isProd,
  sourcemap: isProd ? false : 'linked',
  legalComments: 'none',
  logLevel: 'info',
};

/** @type {Record<string, import('esbuild').BuildOptions>} */
const targets = {
  main: {
    ...shared,
    entryPoints: [r('src/main/main.ts')],
    outfile: r('dist/main/main.js'),
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    external: ['electron'],
  },
  // Preload roda com sandbox: true → precisa ser um único arquivo CJS (só `require('electron')`).
  preload: {
    ...shared,
    entryPoints: [r('src/preload/preload.ts')],
    outfile: r('dist/preload/preload.js'),
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    external: ['electron'],
  },
  renderer: {
    ...shared,
    entryPoints: [
      { in: r('src/renderer/app.ts'), out: 'app' },
      { in: r('src/renderer/styles/main.css'), out: 'styles' },
    ],
    outdir: r('dist/renderer'),
    platform: 'browser',
    format: 'iife',
    target: 'chrome130',
  },
};

async function copyStatic() {
  await mkdir(r('dist/renderer'), { recursive: true });
  await copyFile(r('src/renderer/index.html'), r('dist/renderer/index.html'));
  try {
    await cp(r('src/renderer/assets'), r('dist/renderer/assets'), { recursive: true });
  } catch (err) {
    // se não houver pasta assets, prossegue normalmente
  }
}

async function runBuild() {
  await rm(r('dist'), { recursive: true, force: true });
  await Promise.all(Object.values(targets).map((options) => build(options)));
  await copyStatic();
  console.log(`\n✔ Build ${isProd ? 'de produção' : 'de desenvolvimento'} concluído em dist/`);
}

async function runWatch() {
  await rm(r('dist'), { recursive: true, force: true });

  const electronBinary = createRequire(import.meta.url)('electron');
  const pending = new Set(Object.keys(targets));
  /** @type {import('node:child_process').ChildProcess | null} */
  let electron = null;
  let restarting = false;
  /** @type {NodeJS.Timeout | undefined} */
  let restartTimer;

  const launch = () => {
    electron = spawn(electronBinary, ['.'], { cwd: root, stdio: 'inherit' });
    electron.on('exit', (code) => {
      if (!restarting) process.exit(code ?? 0); // usuário fechou o app → encerra o watcher
    });
  };

  const restart = () => {
    clearTimeout(restartTimer);
    restartTimer = setTimeout(() => {
      if (!electron || electron.exitCode !== null) return launch();
      restarting = true;
      electron.once('exit', () => {
        restarting = false;
        launch();
      });
      electron.kill();
    }, 150);
  };

  const contexts = await Promise.all(
    Object.entries(targets).map(([name, options]) =>
      context({
        ...options,
        plugins: [
          {
            name: 'pim-dev-runner',
            setup(builder) {
              builder.onEnd(async (result) => {
                if (result.errors.length > 0) return;
                if (name === 'renderer') await copyStatic();
                if (pending.size > 0) {
                  pending.delete(name);
                  if (pending.size === 0) launch();
                  return;
                }
                restart();
              });
            },
          },
        ],
      }),
    ),
  );

  await Promise.all(contexts.map((ctx) => ctx.watch()));
  fsWatch(r('src/renderer/index.html'), () => void copyStatic().then(restart));

  const shutdown = async () => {
    electron?.kill();
    await Promise.all(contexts.map((ctx) => ctx.dispose()));
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

await (isWatch ? runWatch() : runBuild());
