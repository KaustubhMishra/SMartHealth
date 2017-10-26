var fs = require('fs');

module.exports = function(sequelize, DataTypes) {
    var device = sequelize.define('device', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.STRING,
        manufacturer: DataTypes.STRING,
        model_number: DataTypes.STRING,
        company_id: DataTypes.STRING,
        firmware: DataTypes.STRING,
        version: DataTypes.STRING,
        device_group_id : DataTypes.STRING,
        device_image: DataTypes.STRING,
        device_image_path: {
                type : new DataTypes.VIRTUAL(DataTypes.BOOLEAN, ['device_image']),
                get: function() {
                    if(this.get('device_image')) {
                        if(!fs.existsSync('public/upload/profilepicture/'+this.get('device_image'))) {
                            return '';
                        } else {
                            return 'upload/profilepicture/'+this.get('device_image');
                        }                        
                        return 'upload/profilepicture/'+this.get('device_image');
                    } else {
                        return '';
                    }                  
                }                
            }
    },{freezeTableName:true,tableName:'device',
        paranoid: true,
        classMethods: {
            associate: function(models) {
                    device.belongsTo(models.device_group, {
                        foreignKey: 'device_group_id'
                    }),
                    device.hasMany(models.device_document, {
                        as: 'DeviceDocument', 
                        foreignKey: 'deviceId'
                    })
                }
            }
        });
    return device;
};