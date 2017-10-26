module.exports = function(sequelize, DataTypes) {
    var milestone = sequelize.define('milestone', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        phase_id: DataTypes.STRING,
        name: DataTypes.STRING,
        description: DataTypes.STRING,
        start_date: DataTypes.DATE,
        tentitive_end_date : DataTypes.DATE,
        active : DataTypes.BOOLEAN
    },{freezeTableName:true,tableName:'milestone',
            classMethods: {
                associate: function(models) {
                    milestone.belongsTo(models.phase, {
                            foreignKey: 'phase_id'                        
                        })
                }
            }
        });
    return milestone;
};