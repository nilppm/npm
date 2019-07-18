import { Context } from '@nelts/nelts';
export default async function decodePackageWithPkgname(ctx: Context, next: Function) {
  ctx.pkg = { pathname: ctx.params.pkgname, version: null };
  await next();
}