module.exports = function(sequelize, DataTypes) {
    var trial = sequelize.define('trial', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        company_id: DataTypes.STRING,
        sponsor_id: DataTypes.STRING,
        name: DataTypes.STRING,
        description: DataTypes.STRING,
        trial_type: DataTypes.ENUM('BLINDED','DOUBLE_BLINDED'),
        dsmb_id: DataTypes.STRING,
        drug_name: DataTypes.STRING,
        drug_description: DataTypes.STRING,
        drug_type: DataTypes.STRING,
        dosage: DataTypes.STRING,
        frequency: DataTypes.INTEGER,
        user_id: DataTypes.STRING,
        start_date: DataTypes.DATE,
        end_date : DataTypes.DATE,
        active : DataTypes.BOOLEAN
    },{freezeTableName:true,tableName:'trial'});
    return trial;
};
