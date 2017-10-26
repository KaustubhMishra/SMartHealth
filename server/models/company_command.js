module.exports = function(sequelize, DataTypes) {

    var company_command = sequelize.define('company_command', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.STRING,
        company_id: DataTypes.STRING,
        command: DataTypes.STRING
    }, {
        freezeTableName: true, 
        tableName: 'company_command',
        timestamps: true,     
        paranoid: true, 
    });
    return company_command;
}