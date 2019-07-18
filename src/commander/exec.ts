import { spawn } from 'child_process';

export type ExecOptions = {
  cwd?: string,
  env?: string,
}

export default function exec(name: string, actions: string[], options?: ExecOptions) {
  if (process.platform === 'win32' && name === 'npm') name = 'npm.cmd';
  options = options || {};
  return new Promise((resolve, reject) => {
    let closing = false, timer: NodeJS.Timer = null;
    const env = Object.create(process.env);
    if (options.env) env.NODE_ENV = options.env;
    const ls = spawn(name, actions, {
      env,
      cwd: options.cwd || process.cwd(),
      stdio: 'inherit'
    });

    ls.on('close', (code: number) => {
      clearInterval(timer);
      process.off('SIGINT', close);
      process.off('SIGQUIT', close);
      process.off('SIGTERM', close);
      if (code === 0) return resolve();
      reject(new Error(`child process exited with code ${code}`));
      if (closing) {
        process.exit(0);
      }
    });
    process.on('SIGINT', close);
    process.on('SIGQUIT', close);
    process.on('SIGTERM', close);
    function close() {
      if (closing) return;
      closing = true;
      timer = setInterval(() => {}, 10);
    }
  });
}