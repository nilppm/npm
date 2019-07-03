import { OrmContext } from '@nelts/orm';
import MaintainerSequelize from './sequelize/maintainer';
import PackageSequelize from './sequelize/package';
import TagSequelize from './sequelize/tag';
import UserSequelize from './sequelize/user';
import VersionSequelize from './sequelize/version';
import StatisticsTableModel from './sequelize/statistics';
interface SequelizeItems {
    maintainer: typeof MaintainerSequelize;
    package: typeof PackageSequelize;
    tag: typeof TagSequelize;
    user: typeof UserSequelize;
    version: typeof VersionSequelize;
    statistics: typeof StatisticsTableModel;
}
export declare type NPMContext = OrmContext<SequelizeItems>;
export {};
