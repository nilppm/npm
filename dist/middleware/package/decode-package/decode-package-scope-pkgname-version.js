"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function decodePackageWithScopePkgnameAndVersion(ctx, next) {
    const scope = ctx.params.scope;
    const pkgname = ctx.params.pkgname;
    const version = ctx.params.version;
    ctx.pkg = { pathname: `@${scope}/${pkgname}`, version };
    await next();
}
exports.default = decodePackageWithScopePkgnameAndVersion;