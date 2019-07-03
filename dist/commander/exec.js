"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
function exec(name, actions, options) {
    if (process.platform === 'win32' && name === 'npm')
        name = 'npm.cmd';
    options = options || {};
    return new Promise((resolve, reject) => {
        let closing = false, timer = null;
        const env = Object.create(process.env);
        if (options.env)
            env.NODE_ENV = options.env;
        const ls = child_process_1.spawn(name, actions, {
            env,
            cwd: options.cwd || process.cwd(),
            stdio: 'inherit'
        });
        ls.on('close', (code) => {
            clearInterval(timer);
            process.off('SIGINT', close);
            process.off('SIGQUIT', close);
            process.off('SIGTERM', close);
            if (code === 0)
                return resolve();
            reject(new Error(`child process exited with code ${code}`));
            if (closing) {
                process.exit(0);
            }
        });
        process.on('SIGINT', close);
        process.on('SIGQUIT', close);
        process.on('SIGTERM', close);
        function close() {
            if (closing)
                return;
            closing = true;
            timer = setInterval(() => { }, 10);
        }
    });
}
exports.default = exec;
