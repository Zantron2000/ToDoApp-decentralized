const { DefaultList } = require("../models/model");

/**
 * Verifies that a user is logged in, with a valid SIWE session,
 * and if so saves data to the request
 *
 * @param {import("express").Request} req The incoming API request
 * @param {import("express").Response} res The outgoing API response
 * @param {import("express").NextFunction} next The next function in the callstack to call
 * @returns A response from either the next function or an authentication error
 */
const loggedIn = (req, res, next) => {
  if (req?.ssx?.verified) {
    // Saves user address to req.user.address
    req.user = { address: req.ssx.siwe.data.address };
    return next();
  }

  return res.status(401).send({
    error: "UnauthorizedError",
    message: "User must be authenticated",
  });
};

/**
 * Verifies that a postman request has an address to fake authentication,
 * and if so, saves data to the request. Also checks if a new default list needs
 * to be made
 *
 * @param {import("express").Request} req The incoming API request
 * @param {import("express").Response} res The outgoing API response
 * @param {import("express").NextFunction} next The next function in the callstack to call
 * @returns A response from either the next function or an authentication error
 */
const postmanLogin = async (req, res, next) => {
  if (req?.body?.address) {
    // Saves user address to req.user.address
    req.user = { address: req.body.address };
    await isNewUser(req);

    delete req.body.address;
    return next();
  }

  res.status(401).send({
    error: "PostmanError",
    message: "Include additional address property in body to fake SSX login",
  });
};

/**
 * Checks if the address is new to the system, and if so, creates a new
 * default task list for the address
 *
 * @param {import("express").Request} req The incoming API request
 */
const isNewUser = async (req) => {
  let defaultList = await DefaultList.findOne({
    owner: req.body.address,
  }).lean();

  if (!defaultList) {
    defaultList = new DefaultList({ owner: req.body.address, title: "Tasks" });
    await defaultList.save();
  }
};

module.exports = {
  loggedIn,
  postmanLogin,
  isNewUser,
};
