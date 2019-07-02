"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
class TagTableModel extends sequelize_1.Model {
    static installer(sequelize) {
        TagTableModel.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: sequelize_1.DataTypes.STRING(100),
                unique: 'uq_pid_name',
            },
            pid: {
                type: sequelize_1.DataTypes.INTEGER,
                unique: 'uq_pid_name',
            },
            vid: sequelize_1.DataTypes.INTEGER,
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
exports.default = TagTableModel;
