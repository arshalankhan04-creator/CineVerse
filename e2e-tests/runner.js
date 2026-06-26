const { spawn } = require('child_process');
const path = require('path');

const runnerDir = __dirname;
const projectRoot = path.resolve(runnerDir, '..');
const jestConfigPath = path.join(runnerDir, 'jest.config.js');

console.log('--- CineVerse E2E Custom Runner ---');
console.log('Project root:', projectRoot);
console.log('Jest config:', jestConfigPath);

const backendDir = path.join(projectRoot, 'backend');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npx.cmd' : 'npx';

const args = ['jest', '--config', jestConfigPath, '--runInBand'];

console.log(`Running: ${npmCmd} ${args.join(' ')} inside Cwd: ${backendDir}`);

const jestProcess = spawn(npmCmd, args, {
  cwd: backendDir,
  stdio: 'inherit',
  env: { ...process.env, FORCE_COLOR: 'true' },
  shell: true
});

jestProcess.on('close', (code) => {
  console.log(`Jest process finished with exit code ${code}`);
  process.exit(code);
});
