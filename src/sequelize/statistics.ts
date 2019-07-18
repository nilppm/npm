import { Model, DataTypes, Sequelize } from 'sequelize';

export default class StatisticsTableModel extends Model {
  public id: number;
  public pathname: string;
  public version: string;
  public ctime: Date;
  public mtime: Date;

  public static installer(sequelize: Sequelize) {
    StatisticsTableModel.init({
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      pathname: {
        type: DataTypes.STRING(200),
      },
      version: {
        type: DataTypes.STRING(100),
      }
    }, {
      tableName: 'statistics',
      sequelize,
      createdAt: 'ctime',
      updatedAt: 'mtime',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }
}