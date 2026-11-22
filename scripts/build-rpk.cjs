'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const defaultRootDir = path.resolve(__dirname, '..');

function findNodeModules(rootDir = defaultRootDir) {
  const candidates = [
    path.join(rootDir, 'node_modules'),
    path.join(rootDir, '..', 'HTMLLab', 'vela-quickapp', 'node_modules'),
  ];
  const found = candidates.find((dir) => fs.existsSync(path.join(dir, 'aiot-toolkit', 'lib', 'bin.js')));
  if (!found) {
    throw new Error('aiot-toolkit not found. Run npm install or check HTMLLab/vela-quickapp.');
  }
  return found;
}

function buildRpk({ rootDir = defaultRootDir, mode = 'release', outPath } = {}) {
  if (!['build', 'release'].includes(mode)) {
    throw new Error('Usage: build-rpk.cjs [--mode build|release]');
  }
  const modulesDir = findNodeModules(rootDir);
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'band-browser-build-'));

  try {
    fs.cpSync(path.join(rootDir, 'src'), path.join(stage, 'src'), { recursive: true });
    fs.cpSync(path.join(rootDir, 'sign'), path.join(stage, 'sign'), { recursive: true });

    const manifest = JSON.parse(fs.readFileSync(path.join(stage, 'src', 'manifest.json'), 'utf8'));
    const stagePkg = {
      name: manifest.package || 'io.github.o_o1112.bandbrowser',
      version: manifest.versionName || '1.0.0',
      private: true,
      devDependencies: { 'aiot-toolkit': '^2.0.5' },
    };
    fs.writeFileSync(path.join(stage, 'package.json'), JSON.stringify(stagePkg, null, 2) + '\n');
    fs.symlinkSync(modulesDir, path.join(stage, 'node_modules'), 'junction');

    const toolkit = path.join(modulesDir, 'aiot-toolkit', 'lib', 'bin.js');
    const cliArgs = [toolkit, mode, ...(mode === 'release' ? ['--enable-jsc'] : [])];
    const res = spawnSync(process.execPath, cliArgs, {
      cwd: stage,
      stdio: 'inherit',
      env: process.env,
    });

    if (res.status !== 0) {
      throw new Error(`aiot-toolkit ${mode} exited with code ${res.status}`);
    }

    const distDir = path.join(stage, 'dist');
    const files = fs.existsSync(distDir) ? fs.readdirSync(distDir).filter((f) => f.endsWith('.rpk')) : [];
    if (files.length === 0) {
      throw new Error(`No .rpk produced in ${distDir}`);
    }

    const targetDir = path.join(rootDir, 'dist');
    fs.mkdirSync(targetDir, { recursive: true });
    const srcRpk = path.join(distDir, files[0]);
    const finalPath = outPath || path.join(targetDir, `${manifest.package}.${mode}.rpk`);
    fs.copyFileSync(srcRpk, finalPath);

    // Sync built AstroBox .abp plugin alongside .rpk when available
    const pluginDist = path.join(rootDir, 'astrobox-plugin', 'dist');
    if (fs.existsSync(pluginDist)) {
      for (const f of fs.readdirSync(pluginDist)) {
        if (f.endsWith('.abp')) {
          fs.copyFileSync(path.join(pluginDist, f), path.join(targetDir, f));
        }
      }
    }

    const sizeKB = (fs.statSync(finalPath).size / 1024).toFixed(1);
    console.log(`Built .rpk: ${finalPath} (${sizeKB} KB)`);
    return finalPath;
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  let mode = 'release';
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--mode' && args[i + 1]) mode = args[i + 1];
  }
  buildRpk({ mode });
}

module.exports = { buildRpk };
