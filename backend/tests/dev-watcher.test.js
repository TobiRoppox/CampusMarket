import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const backend = fileURLToPath(new URL('../', import.meta.url));

test('development watcher ignores database saves but reloads source changes', { timeout: 20000 }, async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'campus-watcher-'));
  let watcher;
  let output = '';
  const waitForRuns = async (count) => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if ((output.match(/clean exit/g) || []).length >= count) return;
      await delay(100);
    }
    assert.fail(`Expected ${count} application runs. Watcher output: ${output}`);
  };
  try {
    await fs.mkdir(path.join(directory, 'src/data'), { recursive: true });
    await fs.copyFile(path.join(backend, 'nodemon.json'), path.join(directory, 'nodemon.json'));
    await fs.writeFile(path.join(directory, 'src/app.js'), 'console.log("fixture started");\n');
    await fs.writeFile(path.join(directory, 'src/data/market-data.json'), '{}');
    watcher = spawn(process.execPath, [path.join(backend, 'node_modules/nodemon/bin/nodemon.js'), 'src/app.js'], {
      cwd: directory,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    watcher.stdout.on('data', (chunk) => { output += chunk.toString(); });
    watcher.stderr.on('data', (chunk) => { output += chunk.toString(); });
    await waitForRuns(1);
    await delay(300);
    const database = path.join(directory, 'src/data/market-data.json');
    await fs.writeFile(`${database}.tmp`, '{"orders":[]}');
    await fs.rename(`${database}.tmp`, database);
    await delay(1500);
    assert.equal((output.match(/clean exit/g) || []).length, 1, 'Database saves must not restart the API');
    await fs.appendFile(path.join(directory, 'src/app.js'), 'console.log("source changed");\n');
    await waitForRuns(2);
    assert.match(output, /source changed/);
  } finally {
    if (watcher && watcher.exitCode === null) {
      const stopped = once(watcher, 'exit');
      watcher.kill();
      await stopped;
    }
    await fs.rm(directory, { recursive: true, force: true });
  }
});
