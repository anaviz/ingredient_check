const jsonrepair = require('jsonrepair');

function repairJSON(jsonString) {
  try {
    console.log("Attempting to repair JSON");
    const repairedJSON = jsonrepair(jsonString);
    console.log("JSON repaired successfully");
    return repairedJSON;
  } catch (error) {
    console.error("Error repairing JSON:", error.message);
    console.error(error.stack);
    throw new Error("Failed to repair JSON");
  }
}

module.exports = { repairJSON };