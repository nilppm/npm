"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exec_1 = require("./exec");
const path = require("path");
const fs = require("fs");
function Start(options) {
    const pkg = require(path.resolve(__dirname, '../../package.json'));
    const _pkgfile = path.resolve(process.cwd(), 'package.json');
    const _pkg = fs.existsSync(_pkgfile) ? require(_pkgfile) : pkg;
    const runtime_path = path.resolve(__dirname, '../../node_modules/@nelts/process/dist/runtime.js');
    const config_path = path.resolve(__dirname, '../nelts.config');
    const args = [
        'start',
        runtime_path,
        `--name=${_pkg.name}`,
        '--',
        '--module=@nelts/nelts'
    ];
    args.push(`--base=${__dirname}`);
    args.push(`--config=${config_path}`);
    if (options.max)
        args.push(`--max=${options.max}`);
    if (options.port)
        args.push(`--port=${options.port}`);
    exec_1.default('pm2', args, { env: 'production' }).then(() => process.exit(0));
}
exports.default = Start;
