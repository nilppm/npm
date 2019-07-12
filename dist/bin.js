#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const start_1 = require("./commander/start");
const restart_1 = require("./commander/restart");
const stop_1 = require("./commander/stop");
const pkg = require('../package.json');
program.version(pkg.version, '-v, --version');
program.command('start')
    .description('run server with pm2, env = production')
    .option('-m, --max <max>', 'how many process would you like to bootstrap', 0)
    .option('-p, --port <port>', 'which port do server run at?', 8080)
    .option('-l, --level <level>', 'logger level?', 'debug')
    .action(start_1.default);
program.command('restart')
    .description('restart the production server')
    .action(restart_1.default);
program.command('stop')
    .description('stop the production server')
    .action(stop_1.default);
program.parse(process.argv);
