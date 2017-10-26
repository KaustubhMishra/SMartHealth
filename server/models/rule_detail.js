module.exports = function(sequelize, DataTypes) {

    var rule_detail = sequelize.define('rule_detail', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        key: DataTypes.STRING,
        operator: DataTypes.STRING,
        rule_id: DataTypes.STRING,
        value: DataTypes.STRING,
        template_attr_id: DataTypes.STRING,
        template_attr_parent_id: DataTypes.STRING
    },{freezeTableName: true, tableName: 'rule_detail', timestamps: false });
    return rule_detail;
}