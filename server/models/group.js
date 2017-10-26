/*
 * Group Model
 */

module.exports = function(sequelize, DataTypes) {

	var Group = sequelize.define('Group', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		name: DataTypes.STRING(100)
	}, {
		//disable the modification of tablenames; By default, sequelize will automatically
		//transform all passed model names (first parameter of define) into plural.
		//if you don't want that, set the following
		freezeTableName: true,
		//define the table's name
		tableName: 'group',
		timestamps: false

	});

	return Group;
};