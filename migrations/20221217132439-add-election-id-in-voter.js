'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    //adding the electionid column from Voters table
      await queryInterface.addColumn("Voters", "electionID", {
        type: Sequelize.DataTypes.INTEGER,
      });
  
      await queryInterface.addConstraint("Voters", {
        fields: ["electionID"],
        type: "foreign key",
        references: {
          table: "Elections",
          field: "id",
        },
      });
      
    },
  
    async down(queryInterface, Sequelize) {
    //dropping the electionid column from Voters table
      await queryInterface.removeColumn("Voters", "electionID");
      
    },
};
