const { handleNodeRequest } = require("../server/inquire-handler");

module.exports = async (req, res) => {
  await handleNodeRequest(req, res);
};
