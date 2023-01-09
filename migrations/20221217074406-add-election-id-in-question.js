'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
  //adding the electionid column from questions table
    await queryInterface.addColumn("Questions", "electionID", {
      type: Sequelize.DataTypes.INTEGER,
    });

    await queryInterface.addConstraint("Questions", {
      fields: ["electionID"],
      type: "foreign key",
      references: {
        table: "Elections",
        field: "id",
      },
    });
    
  },

  async down(queryInterface, Sequelize) {
  //dropping the electionid column from questions table
    await queryInterface.removeColumn("Questions", "electionID");
    
  },
};
