import { Model, Sequelize } from 'sequelize';
export default class TagTableModel extends Model {
    id: number;
    name: string;
    pid: number;
    vid: number;
    static installer(sequelize: Sequelize): void;
}
