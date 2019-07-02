"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function decodePackageWithPkgnameAndVersion(ctx, next) {
    ctx.pkg = { pathname: ctx.params.pkgname, version: ctx.params.version };
    await next();
}
exports.default = decodePackageWithPkgnameAndVersion;
