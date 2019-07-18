#!/usr/bin/env node

import * as program from 'commander';
import Start from './commander/start';
import ReStart from './commander/restart';
import Stop from './commander/stop';

const pkg = require('../package.json');
program.version(pkg.version, '-v, --version');

program.command('start')
  .description('run server with pm2, env = production')
  .option('-m, --max <max>', 'how many process would you like to bootstrap', 0)
  .option('-p, --port <port>', 'which port do server run at?', 8080)
  .option('-l, --level <level>', 'logger level?', 'debug')
  .action(Start);

program.command('restart')
  .description('restart the production server')
  .action(ReStart);

program.command('stop')
  .description('stop the production server')
  .action(Stop);


program.parse(process.argv);
