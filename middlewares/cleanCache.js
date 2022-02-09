const { clearHash } = require('../services/cache');

module.exports = async (req, res, next) => {
  await next(); // To await for the execution of route handler does and come back over to the midlleware.
  clearHash(req.user.id);
};
