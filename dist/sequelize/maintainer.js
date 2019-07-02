"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
class MaintainerTableModel extends sequelize_1.Model {
    static installer(sequelize) {
        MaintainerTableModel.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },
            account: {
                type: sequelize_1.DataTypes.STRING(100),
                unique: 'uq_pid_uid',
                allowNull: false,
            },
            pid: {
                type: sequelize_1.DataTypes.INTEGER({ length: 11 }),
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
exports.default = MaintainerTableModel;
