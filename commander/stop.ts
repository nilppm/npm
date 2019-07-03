
import exec from './exec';
import * as path from 'path';
import * as fs from 'fs';

export default function Stop() {
  const pkg = require(path.resolve(__dirname, '../../package.json'));
  const _pkgfile = path.resolve(process.cwd(), 'package.json');
  const _pkg = fs.existsSync(_pkgfile) ? require(_pkgfile) : pkg;
  const args: string[] = [ 'stop', _pkg.name ];
  exec('pm2', args, { env: 'production' }).then(() => process.exit(0));
}