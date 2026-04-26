const { handleNetlifyEvent } = require("../../server/inquire-handler");

exports.handler = async (event) => {
  return handleNetlifyEvent(event);
};
