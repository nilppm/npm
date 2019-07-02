import { Model, DataTypes, Sequelize } from 'sequelize';

export default class TagTableModel extends Model {
  public id: number;
  public name: string;
  public pid: number;
  public vid: number;

  public static installer(sequelize: Sequelize) {
    TagTableModel.init({
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(100),
        unique: 'uq_pid_name',
      },
      pid: {
        type: DataTypes.INTEGER,
        unique: 'uq_pid_name',
      },
      vid: DataTypes.INTEGER,
    }, {
      tableName: 'tag',
      sequelize,
      createdAt: 'ctime',
      updatedAt: 'mtime',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }
}