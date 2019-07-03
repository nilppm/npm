import { Model, Sequelize } from 'sequelize';
export default class StatisticsTableModel extends Model {
    id: number;
    pathname: string;
    version: string;
    ctime: Date;
    mtime: Date;
    static installer(sequelize: Sequelize): void;
}
