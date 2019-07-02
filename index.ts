import { OrmContext } from '@nelts/orm';

import MaintainerSequelize from './sequelize/maintainer';
import PackageSequelize from './sequelize/package';
import TagSequelize from './sequelize/tag';
import UserSequelize from './sequelize/user';
import VersionSequelize from './sequelize/version';

interface SequelizeItems {
  maintainer: typeof MaintainerSequelize,
  package: typeof PackageSequelize,
  tag: typeof TagSequelize,
  user: typeof UserSequelize,
  version: typeof VersionSequelize,
}

export type NPMContext = OrmContext<SequelizeItems>;