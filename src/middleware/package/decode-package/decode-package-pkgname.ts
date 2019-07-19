import { NPMContext } from '../../../index';
export default async function decodePackageWithPkgname(ctx: NPMContext, next: Function) {
  ctx.pkg = { pathname: ctx.params.pkgname, version: null };
  await next();
}