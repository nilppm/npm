import * as fs from 'fs';
import { NPMContext } from '../index';
export default async function Total(ctx: NPMContext) {
  const packages = await ctx.dbo.package.count();
  const users = await ctx.dbo.user.count();
  const versions = await ctx.dbo.version.count();
  const nfs = fs.statSync(ctx.app.configs.nfs);

  return {
    db_name: 'NILPPM - CPM',
    data_size: nfs.size,
    total: {
      package: packages,
      user: users,
      version: versions
    }
  }
}