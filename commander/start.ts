import exec from './exec';
import * as path from 'path';
import * as fs from 'fs';

export interface DevOptions {
  max: string | number,
  port: string | number,
  level?: string
}

export default function Start(options: DevOptions) {
  const pkg = require(path.resolve(__dirname, '../../package.json'));
  const _pkgfile = path.resolve(process.cwd(), 'package.json');
  const _pkg = fs.existsSync(_pkgfile) ? require(_pkgfile) : pkg;
  const processpath = require.resolve('@nelts/process');
  const runtime_path = path.resolve(path.dirname(processpath), 'runtime.js');
  const config_path = path.resolve(__dirname, '../nelts.config');
  const args: string[] = [
    'start',
    runtime_path,
    `--name=${_pkg.name}`,
    '--',
    '--module=@nelts/nelts'
  ];

  args.push(`--base=${path.resolve(__dirname, '../../')}`);
  args.push(`--config=${config_path}`);
  if (options.max) args.push(`--max=${options.max}`);
  if (options.port) args.push(`--port=${options.port}`);
  if (options.level) args.push(`--level=${options.level}`);
  
  exec('pm2', args, { env: 'production' }).then(() => process.exit(0));
}