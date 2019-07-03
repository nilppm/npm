"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exec_1 = require("./exec");
const path = require("path");
const fs = require("fs");
function Stop() {
    const pkg = require(path.resolve(__dirname, '../../package.json'));
    const _pkgfile = path.resolve(process.cwd(), 'package.json');
    const _pkg = fs.existsSync(_pkgfile) ? require(_pkgfile) : pkg;
    const args = ['stop', _pkg.name];
    exec_1.default('pm2', args, { env: 'production' }).then(() => process.exit(0));
}
exports.default = Stop;
