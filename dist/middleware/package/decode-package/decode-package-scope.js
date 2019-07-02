"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function decodePackageWithScope(ctx, next) {
    const scope = decodeURIComponent(ctx.params.scope);
    ctx.pkg = { pathname: `@${scope}`, version: null };
    await next();
}
exports.default = decodePackageWithScope;
