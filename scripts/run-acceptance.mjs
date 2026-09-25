import { spawnSync } from 'node:child_process';
import path from 'node:path';

const npmEntryPoint = process.env.npm_execpath;
const npmCommand = npmEntryPoint ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
const auditRoot = path.resolve('.cache', `acceptance-${Date.now()}`);

function run(args, env = process.env) {
  const result = spawnSync(npmCommand, npmEntryPoint ? [npmEntryPoint, ...args] : args, {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
    shell: false
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(['test'], {
  ...process.env,
  DATA_DIR: path.join(auditRoot, 'data'),
  UPLOAD_DIR: path.join(auditRoot, 'uploads')
});
run(['run', 'build']);
run(['run', 'test:e2e']);
