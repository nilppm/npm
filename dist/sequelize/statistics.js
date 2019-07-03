"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
class StatisticsTableModel extends sequelize_1.Model {
    static installer(sequelize) {
        StatisticsTableModel.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },
            pathname: {
                type: sequelize_1.DataTypes.STRING(200),
            },
            version: {
                type: sequelize_1.DataTypes.STRING(100),
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
exports.default = StatisticsTableModel;
