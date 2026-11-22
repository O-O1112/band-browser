'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const emulatorPkgPath = [
  path.join(rootDir, 'node_modules', '@aiot-toolkit', 'emulator'),
  path.join(rootDir, '..', 'HTMLLab', 'vela-quickapp', 'node_modules', '@aiot-toolkit', 'emulator'),
].find((p) => fs.existsSync(p));

if (!emulatorPkgPath) {
  throw new Error('@aiot-toolkit/emulator not found.');
}

const { PreInstance } = require(emulatorPkgPath);
const { createGrpcClient } = require(path.join(emulatorPkgPath, 'lib', 'vvd', 'grpc'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tap(agent, x, y, holdMs = 80) {
  agent.sendMouse({ x: Math.round(x), y: Math.round(y), buttons: 1, display: 0 });
  await sleep(holdMs);
  agent.sendMouse({ x: Math.round(x), y: Math.round(y), buttons: 0, display: 0 });
}

async function drag(agent, x1, y1, x2, y2, steps = 8) {
  agent.sendMouse({ x: Math.round(x1), y: Math.round(y1), buttons: 1, display: 0 });
  for (let i = 1; i <= steps; i += 1) {
    await sleep(30);
    const nx = x1 + ((x2 - x1) * i) / steps;
    const ny = y1 + ((y2 - y1) * i) / steps;
    agent.sendMouse({ x: Math.round(nx), y: Math.round(ny), buttons: 1, display: 0 });
  }
  await sleep(50);
  agent.sendMouse({ x: Math.round(x2), y: Math.round(y2), buttons: 0, display: 0 });
}

async function capture(agent, outDirs, filename) {
  const buf = await agent.getScreenshot();
  for (const dir of outDirs) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buf);
  }
  console.log(`Captured ${filename} (${buf.length} bytes)`);
  return buf;
}

async function main() {
  const pkg = 'io.github.o_o1112.bandbrowser';
  const rpkPath = path.join(rootDir, 'dist', `${pkg}.release.rpk`);
  if (!fs.existsSync(rpkPath)) {
    throw new Error(`Missing .rpk at ${rpkPath}. Run npm run build:rpk first.`);
  }

  const extraDir = process.argv[2] ? path.resolve(process.argv[2]) : null;
  const outDirs = [path.join(rootDir, 'docs', 'walkthrough', 'screenshots')];
  if (extraDir) outDirs.push(extraDir);

  const velaHome = path.join(os.homedir(), '.vela');
  const adbDir = path.join(velaHome, 'sdk', 'tools', 'adb', 'win');
  process.env.PATH = `${adbDir}${path.delimiter}${process.env.PATH || ''}`;

  const emulatorBin = path.join(velaHome, 'sdk', 'emulator', 'windows-x86_64', 'emulator.exe');
  const grpcPort = 8554;
  const serialPort = 5554;
  const logs = [];

  console.log('Launching headless Vela_Virtual_Device (336x480 Band 9 Pro)...');
  const emuProc = spawn(
    emulatorBin,
    [
      '-vela',
      '-avd', 'Vela_Virtual_Device',
      '-no-window',
      '-show-kernel',
      '-grpc', String(grpcPort),
      '-port', String(serialPort),
    ],
    {
      cwd: path.join(velaHome, 'sdk'),
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  let grpcReady = false;
  emuProc.stdout.on('data', (chunk) => {
    const text = chunk.toString('utf8');
    for (const line of text.split(/\r?\n/)) {
      const s = line.trim();
      if (!s) continue;
      logs.push(s);
      if (/Started GRPC server/i.test(s)) grpcReady = true;
    }
  });
  emuProc.stderr.on('data', (chunk) => {
    const text = chunk.toString('utf8');
    for (const line of text.split(/\r?\n/)) {
      const s = line.trim();
      if (s) logs.push('[ERR] ' + s);
    }
  });

  const agent = createGrpcClient({ 'grpc.port': grpcPort, 'grpc.token': '' });
  const emulatorInstance = new PreInstance({
    serialPort: String(serialPort),
    vvdName: 'Vela_Virtual_Device',
    logcatProcess: emuProc,
    customLogger(msg) {
      logs.push('[PRE] ' + String(msg));
    },
  });

  try {
    let connected = false;
    for (let i = 0; i < 35; i += 1) {
      if (grpcReady && (await emulatorInstance.isConnected())) {
        connected = true;
        break;
      }
      await sleep(1000);
    }
    if (!connected) {
      throw new Error('Emulator did not become ready in time:\n' + logs.slice(-25).join('\n'));
    }

    await agent.waitForReady();
    await sleep(1500);
    console.log(`Installing & launching ${pkg}...`);

    await emulatorInstance.pushAndInstall(rpkPath, pkg);
    await sleep(800);
    await emulatorInstance.startApp(pkg, false);
    await sleep(2200);

    // 1. Browser Home (Omnibox + Grid + Bookmarks)
    await capture(agent, outDirs, 'emu_01_home.png');

    // 2. Tap "维基百科" list card (~x: 168, y: 275)
    await tap(agent, 168, 275);
    await sleep(1800);
    await capture(agent, outDirs, 'emu_02_reader_wiki.png');

    // 3. Scroll down inside reader twice to bring hyperlink cards cleanly into mid-screen
    await drag(agent, 168, 380, 168, 80);
    await sleep(400);
    await drag(agent, 168, 380, 168, 80);
    await sleep(700);
    await capture(agent, outDirs, 'emu_03_reader_links.png');

    // Tap first hyperlink card (~y: 250) to test page jump + Back stack
    await tap(agent, 168, 250);
    await sleep(1600);
    await capture(agent, outDirs, 'emu_04_link_follow.png');

    // 4. Tap top-left floating back button twice (link -> wiki -> home), then top-right search button
    await tap(agent, 42, 42);
    await sleep(700);
    await tap(agent, 42, 42);
    await sleep(700);
    await tap(agent, 294, 42);
    await sleep(1000);
    await capture(agent, outDirs, 'emu_05_address_keyboard.png');

    const interesting = logs.filter((l) => /WIDGETLOG|JsCall|error|exception|fail|assert/i.test(l));
    if (interesting.length > 0) {
      console.log('--- Emulator App/JS Logs ---');
      console.log(interesting.slice(-25).join('\n'));
    }
  } finally {
    console.log('Shutting down emulator...');
    try {
      agent.close();
    } catch (_) {}
    if (process.platform === 'win32' && emuProc && emuProc.pid) {
      try {
        execFileSync('taskkill', ['/PID', String(emuProc.pid), '/T', '/F'], { stdio: 'ignore' });
      } catch (_) {}
    } else {
      try {
        emuProc.kill('SIGKILL');
      } catch (_) {}
    }
    await sleep(400);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
