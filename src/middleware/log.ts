import { NPMContext } from '../index';
export default async function LoggerError(ctx: NPMContext, next: Function) {
  ctx.on('error', (err: Error) => console.error(err));
  await next();
}