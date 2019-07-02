"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function decodePackageWithPkgname(ctx, next) {
    ctx.pkg = { pathname: ctx.params.pkgname, version: null };
    await next();
}
exports.default = decodePackageWithPkgname;
