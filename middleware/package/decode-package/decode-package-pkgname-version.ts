import { Context } from '@nelts/nelts';
export default async function decodePackageWithPkgnameAndVersion(ctx: Context, next: Function) {
  ctx.pkg = { pathname: ctx.params.pkgname, version: ctx.params.version };
  await next();
}