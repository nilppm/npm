import { Model, DataTypes, Sequelize } from 'sequelize';

export default class MaintainerTableModel extends Model {
  public id: number;
  public account: string;
  public pid: number;

  public static installer(sequelize: Sequelize) {
    MaintainerTableModel.init({
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      account: {
        type: DataTypes.STRING(100),
        unique: 'uq_pid_uid',
        allowNull: false,
      },
      pid: {
        type: DataTypes.INTEGER({ length: 11 }),
        unique: 'uq_pid_uid',
        allowNull: false,
      }
    }, {
      tableName: 'maintainer',
      sequelize,
      createdAt: 'ctime',
      updatedAt: 'utime',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }
}