"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function LoggerError(ctx, next) {
    ctx.on('error', (err) => console.error(err));
    await next();
}
exports.default = LoggerError;
