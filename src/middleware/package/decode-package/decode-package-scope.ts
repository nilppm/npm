import { NPMContext } from '../../../index';
export default async function decodePackageWithScope(ctx: NPMContext, next: Function) {
  const scope = decodeURIComponent(ctx.params.scope);
  ctx.pkg = { pathname: `@${scope}`, version: null };
  await next();
}